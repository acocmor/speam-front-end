function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}
var av = Autodesk.Viewing,
avp = av.Private;

var VertexBufferBuilder = avp.VertexBufferBuilder;

import { Path2D } from "./path2d";
import { SetTesselationParams } from "./bezier";

var _document = av.getGlobal().document;
//Custom implementation of HTML Canvas API used for rendering PDF geometry using the WebGL accelerated F2D renderer


//A custom context object that overloads standard HMTL Canvas 2D context to intercept draw
//calls and pipe them into LMV vertex buffers
export function hijackContextAPI(inContext, lmvContext) {

  var fnList = [
  "fillRect",
  "strokeRect",
  "clearRect",
  "beginPath",
  "closePath",
  "moveTo",
  "lineTo",
  "arc",
  "arcTo",
  "quadraticCurveTo",
  "bezierCurveTo",
  "rect",
  "fill",
  "stroke",
  "clip",
  "strokeText",
  "fillText",
  "drawImage",
  "save",
  "restore",
  "setLineDash",
  "createPattern",

  // OCG related
  "beginMarkedContent",
  "beginMarkedContentProps",
  "endMarkedContent",
  "setCurrentOperatorIndex",

  //Inject this function into canvas context so we can batch process inlineImageGroup related calls
  "needDelegateInlineImageGroup",
  "isLMVCanvasContext"];


  fnList.forEach(function (fn) {
    inContext["_original" + fn] = inContext[fn];
    inContext[fn] = lmvContext[fn].bind(lmvContext);
  });

}

var QUAD_TEXTURE = 1;
var IMAGE_TEXTURE = 2;

var _tmpXform = new Array(6);
var _tmpVec = new THREE.Vector2();
var _tmpBox = new THREE.Box2();


//Used for matrix decomposition in drawImage
var _offset = new THREE.Vector3();
var _quat = new THREE.Quaternion();
var _scale = new THREE.Vector3();
var _axis = new THREE.Vector3();
var _mtx4 = new THREE.Matrix4();

export var LmvCanvasContext = /*#__PURE__*/function () {_createClass(LmvCanvasContext, null, [{ key: "isRef",

    /**
                                                                                                               * Check is a PDF Ref object
                                                                                                               * @param {PDF.Ref} obj 
                                                                                                               */value: function isRef(
    obj) {
      return obj != null && typeof obj.num === "number" && typeof obj.gen === "number";
    }

    /**
       * generate a simple string works as a key for the ref.
       * @param {PDF.Ref} ref 
       */ }, { key: "refKey", value: function refKey(
    ref) {
      return "".concat(ref.num, "-").concat(ref.gen);
    } }]);

  function LmvCanvasContext(viewport, toPageUnits, meshCallback, fontEngine, usingTextLayer, fontAtlas, pdfRefMap) {_classCallCheck(this, LmvCanvasContext);

    //
    // Prepare canvas using PDF page dimensions
    //
    //TODO: Do we need that or can we just overload the entire CanvasContext API and skip the HTML element creation completely?
    var canvas = _document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    this.canvasContext = context; //REQUIRED for PDF.js interface
    this.viewport = viewport; //REQUIRED for PDF.js interface
    this.toPageUnits = toPageUnits;

    this.meshCallback = meshCallback;
    // only set bounds for PDF, because edit2d and 
    if (viewport.clipToViewport == true) {
      var offsetX = viewport.offsetX || 0;
      var offsetY = viewport.offsetY || 0;
      this.bounds = new THREE.Vector4(offsetX * toPageUnits, offsetY * toPageUnits,
      (viewport.width + offsetX) * toPageUnits, (viewport.height + offsetY) * toPageUnits);
    }

    this.currentMeshIndex = 0;
    this.imageNumber = 0;
    this.currentVbb = new VertexBufferBuilder(false);
    this._curPath = null;
    this._curClip = null;
    this.first = true;
    this.states = [];
    this.glyphCache = {};
    this.usingTextLayer = usingTextLayer;

    //Fixed precision tolerance assuming the input is in typographic "point" units.
    this.precisionTolerance = 0.1;

    this.dbId = -1;

    // If true, dbId is automatically increased on each beginPath call.
    this.consecutiveIds = false;

    if (av.isMobileDevice()) {
      SetTesselationParams(undefined, 0.1);
    }

    this.fontEngine = fontEngine;

    // Use solid lines by default. See LineStyleDef.js for other line types (dashed etc.)
    this.lineStyle = 0;

    // If true, lines widths are applied in screen-space
    this.isScreenSpace = false;

    hijackContextAPI(context, this);

    this.layers = {};
    this.defaultLayerId = 0;
    this.currentLayerId = this.defaultLayerId;
    this.sequencedDbId = -1;
    this.taggedId = null;
    this.defaultVPId = 0;
    this.currentVpId = this.defaultVPId;
    this.viewports = [this.createViewPortData(new THREE.Matrix4().elements)];
    this.viewportMap = {};

    this.ocgStack = [];
    // Revit dbID is larger then 4096, id remap is needed
    this.idRemap = [];
    this.idIndexMap = {};

    this.msdfRender = true;
    this.fontAtlas = fontAtlas;
    this.pdfRefMap = pdfRefMap || {};
  }_createClass(LmvCanvasContext, [{ key: "updateDBId", value: function updateDBId()

    {
      if (this.taggedId != null) {
        if (this.idIndexMap[this.taggedId] != undefined) {
          this.dbId = this.idIndexMap[this.taggedId];
        } else {
          this.sequencedDbId++;
          this.dbId = this.sequencedDbId;
          this.idRemap[this.dbId] = this.taggedId;
          this.idIndexMap[this.taggedId] = this.dbId;
        }
      } else {
        if (this.consecutiveIds) {
          this.sequencedDbId++;
          this.dbId = this.sequencedDbId;
        }
        this.idRemap[this.dbId] = this.dbId;
      }
    } }, { key: "save", value: function save()

    {
      //console.log("save");
      this.states.push({
        clip: this._curClip,
        consecutiveIds: this.consecutiveIds,
        dbId: this.dbId,
        lineDashedDef: this.lineDashedDef,
        lineStyle: this.lineStyle });


      this.canvasContext._originalsave();
    } }, { key: "restore", value: function restore()

    {

      var state = this.states.pop();

      if (state) {
        this._curClip = state.clip;
        this.consecutiveIds = state.consecutiveIds;
        this.dbId = state.dbId;
        this.lineDashedDef = state.lineDashedDef;
        this.lineStyle = state.lineStyle;
      }

      //console.log("restore");
      this.canvasContext._originalrestore();
    } }, { key: "flushBuffer", value: function flushBuffer(

    addCount, finalFlush, textureOption)
    {
      if (!this.currentVbb.vcount && !finalFlush)
      {
        return;
      }

      var flush = finalFlush;
      flush = flush || this.currentVbb.isFull(addCount);

      if (flush) {
        if (this.currentVbb.vcount) {
          var mesh = this.currentVbb.toMesh();
          mesh.material = {
            skipEllipticals: !this.currentVbb.numEllipticals,
            skipCircles: !this.currentVbb.numCirculars,
            skipTriangleGeoms: !this.currentVbb.numTriangleGeoms,
            useInstancing: this.currentVbb.useInstancing,
            isScreenSpace: !this.currentImage,
            hasLineStyles: this.currentVbb.hasLineStyles,
            msdfFontTexture: !!this.hasMSDFContent,
            viewportBounds: this.bounds,
            imageUVTexture: textureOption === IMAGE_TEXTURE };


          if (this.currentImage) {
            mesh.material.image = this.currentImage;
            mesh.material.image.name = this.currentImage.cacheKey || this.imageNumber++;
            mesh.material.compositeOperation = this.canvasContext.globalCompositeOperation;
            // Assume the background of PDF page is white, when use it to do multiply, white is better then black color
            // And it should be correct for most cases
            mesh.material.compositeCanvasColor = "#ffffff";
            mesh.material.opacity = this.canvasContext.globalAlpha;
            this.currentImage = null;
          }

          this.meshCallback(mesh, this.currentMeshIndex++);
          this.currentVbb.reset(0);
          this.hasMSDFContent = false;
        }
      }
    }

    //Polytriangle requires some post-processing depending on wheter instancing is used or not
    //TODO: This is copy-pasted from the same function in F2D.js. It's purely used to
    //add half width outline to polytriangles so that they look antialiased.
  }, { key: "addPolyTriangle", value: function addPolyTriangle(points, inds, color, dbId, layer, antialiasEdges) {
      var me = this;
      var edgeMap = null;

      var currentVpId = this.currentVpId;

      var aaLineWeight = -0.5; //negative = in pixel units

      function processEdge(iFrom, iTo) {
        if (iFrom > iTo) {
          var tmp = iFrom;
          iFrom = iTo;
          iTo = tmp;
        }

        if (!edgeMap[iFrom])
        edgeMap[iFrom] = [iTo];else
        {
          var adjacentVerts = edgeMap[iFrom];
          var idx = adjacentVerts.lastIndexOf(iTo);
          if (idx == -1)
          adjacentVerts.push(iTo); //first time we see this edge, so remember it as exterior edge
          else
            adjacentVerts[idx] = -1; //the second time we see an edge mark it as interior edge
        }
      }


      function addAllAntialiasEdges() {

        for (var i = 0, iEnd = edgeMap.length; i < iEnd; i++) {

          var adjacentVerts = edgeMap[i];
          if (!adjacentVerts)
          continue;

          for (var j = 0; j < adjacentVerts.length; j++) {
            var iTo = adjacentVerts[j];
            if (iTo == -1)
            continue; //an interior edge was here -- skip
            else {
                //exterior edge -- add an antialiasing line for it
                me.flushBuffer(4);
                me.currentVbb.addSegment(points[2 * i], points[2 * i + 1],
                points[2 * iTo], points[2 * iTo + 1],
                me.currentLayerId,
                aaLineWeight,
                color,
                dbId, layer, currentVpId, me.lineStyle);
              }
          }
        }
      }

      function antialiasOneEdge(iFrom, iTo) {
        if (iFrom > iTo) {
          var tmp = iFrom;
          iFrom = iTo;
          iTo = tmp;
        }

        var adjacentVerts = edgeMap[iFrom];
        if (!adjacentVerts)
        return;

        var idx = adjacentVerts.indexOf(iTo);
        if (idx != -1) {
          //exterior edge -- add an antialiasing line for it
          me.flushBuffer(4);
          me.currentVbb.addSegment(points[2 * iFrom], points[2 * iFrom + 1],
          points[2 * iTo], points[2 * iTo + 1],
          me.currentLayerId,
          aaLineWeight,
          color,
          dbId, layer, currentVpId, me.lineStyle);
        }
      }

      if (antialiasEdges) {
        edgeMap = new Array(points.length / 2);

        for (var i = 0, iEnd = inds.length; i < iEnd; i += 3) {
          var i0 = inds[i];
          var i1 = inds[i + 1];
          var i2 = inds[i + 2];

          processEdge(i0, i1);
          processEdge(i1, i2);
          processEdge(i2, i0);
        }
      }

      if (isNaN(color) && color.isPattern === true) {
        this.flushBuffer(0, true);
        var image = color.image;
        var count = points.length / 2; // number of vertices

        this.flushBuffer(count);
        var vbb = this.currentVbb;
        var vbase = vbb.vcount;

        // need to apply the transformation to the UV
        var xform = this.getCurrentTransform();
        var x1 = this.tx(0, 0, xform);
        var y1 = this.ty(0, 0, xform);
        var w1 = Math.abs(this.tx(image.width, image.height, xform) - x1);
        var h1 = Math.abs(this.ty(image.width, image.height, xform) - y1);

        for (var i = 0; i < count; ++i) {
          var x = points[2 * i];
          var y = points[2 * i + 1];

          var u = (x - x1) / w1;
          var v = (y - y1) / h1;
          vbb.addVertexImagePolytriangle(x, y, u, v, 0xFFFFFFFF, dbId, layer, currentVpId);
        }

        this.currentImage = image;
        vbb.addIndices(inds, vbase);
        this.flushBuffer(0, true, IMAGE_TEXTURE);
      } else {
        if (this.currentVbb.useInstancing) {
          var count = inds.length;
          for (var i = 0; i < count; i += 3) {
            var i0 = inds[i];
            var i1 = inds[i + 1];
            var i2 = inds[i + 2];

            this.flushBuffer(4);

            this.currentVbb.addTriangleGeom(points[2 * i0], points[2 * i0 + 1],
            points[2 * i1], points[2 * i1 + 1],
            points[2 * i2], points[2 * i2 + 1],
            color, dbId, layer, currentVpId);

            if (antialiasEdges) {
              antialiasOneEdge(i0, i1);
              antialiasOneEdge(i1, i2);
              antialiasOneEdge(i2, i0);
            }
          }
        } else
        {
          var count = points.length / 2; // number of vertices

          this.flushBuffer(count);
          var vbb = this.currentVbb;
          var vbase = vbb.vcount;

          for (var i = 0; i < count; ++i) {
            var x = points[2 * i];
            var y = points[2 * i + 1];
            vbb.addVertexPolytriangle(x, y, color, dbId, layer, currentVpId);
          }

          vbb.addIndices(inds, vbase);

          if (antialiasEdges) {
            addAllAntialiasEdges();
          }

        }
      }
    }

    //Extract colors from HTML Canvas state
  }, { key: "getFillColor", value: function getFillColor() {
      if (this.canvasContext.fillStyle && this.canvasContext.fillStyle.isPattern === true) {
        return this.canvasContext.fillStyle;
      } else if (typeof this.canvasContext.fillStyle !== "string") {
        console.warn("Unsupported fill style.");
        return 0x00000000;
      }

      var rgb = parseInt(this.canvasContext.fillStyle.slice(1), 16);
      var a = 255 * this.canvasContext.globalAlpha << 24;
      var c = a | (rgb & 0xff) << 16 | rgb & 0xff00 | rgb >> 16 & 0xff;
      return c;
    } }, { key: "getStrokeColor", value: function getStrokeColor()

    {

      var ctx = this.canvasContext;

      if (this.lastStrokeStyle === ctx.strokeStyle && ctx.globalAlpha === this.lastAlpha) {
        return this.lastRgb;
      } else {
        var rgb = parseInt(ctx.strokeStyle.slice(1), 16);
        var a = 255 * ctx.globalAlpha << 24;
        var c = a | (rgb & 0xff) << 16 | rgb & 0xff00 | rgb >> 16 & 0xff;

        this.lastRgb = c;
        this.lastStrokeStyle = ctx.strokeStyle;
        this.lastAlpha = ctx.globalAlpha;

        return c;
      }

    } }, { key: "getCurrentTransform", value: function getCurrentTransform()

    {
      var xform = this.canvasContext.mozCurrentTransform;

      //Pay attention here: In case we are processing the path of a character and we want to
      //cache it for later use, we have to neutralize the part of the canvas transform that positions
      //the character in the page, but we need to keep the rest of the transform (that positions parts
      //of the character in its own em-box). This is what the inverse transform multiplication here does.
      //TODO: we can optimize this to only compute the multiplication in case mozCurrentTransform changes.
      if (this.isFontChar) {
        var m = this.invXform;
        var a = xform[0],b = xform[1],c = xform[2],d = xform[3],e = xform[4],f = xform[5];
        _tmpXform[0] = m[0] * a + m[2] * b;
        _tmpXform[1] = m[1] * a + m[3] * b;
        _tmpXform[2] = m[0] * c + m[2] * d;
        _tmpXform[3] = m[1] * c + m[3] * d;
        _tmpXform[4] = m[0] * e + m[2] * f + m[4];
        _tmpXform[5] = m[1] * e + m[3] * f + m[5];
        return _tmpXform;
      }

      return xform;
    } }, { key: "tx", value: function tx(

    x, y, xform) {
      xform = xform || this.getCurrentTransform();
      return (x * xform[0] + y * xform[2] + xform[4]) * (this.isFontChar ? 1 : this.toPageUnits);
    } }, { key: "ty", value: function ty(

    x, y, xform) {
      xform = xform || this.getCurrentTransform();
      return (x * xform[1] + y * xform[3] + xform[5]) * (this.isFontChar ? 1 : this.toPageUnits);
    } }, { key: "scaleValue", value: function scaleValue(

    v, xform) {
      xform = xform || this.getCurrentTransform();
      return this.toPageUnits * Math.sqrt(Math.abs(xform[0] * xform[3] - xform[1] * xform[2])) * v; //assumes uniform;
    } }, { key: "transformBox", value: function transformBox(

    bbox, xform, dst) {
      xform = xform || this.getCurrentTransform();

      _tmpBox.makeEmpty();

      _tmpVec.set(this.tx(bbox.min.x, bbox.min.y, xform), this.ty(bbox.min.x, bbox.min.y, xform));
      _tmpBox.expandByPoint(_tmpVec);

      _tmpVec.set(this.tx(bbox.max.x, bbox.min.y, xform), this.ty(bbox.max.x, bbox.min.y, xform));
      _tmpBox.expandByPoint(_tmpVec);

      _tmpVec.set(this.tx(bbox.max.x, bbox.max.y, xform), this.ty(bbox.max.x, bbox.max.y, xform));
      _tmpBox.expandByPoint(_tmpVec);

      _tmpVec.set(this.tx(bbox.min.x, bbox.max.y, xform), this.ty(bbox.min.x, bbox.max.y, xform));
      _tmpBox.expandByPoint(_tmpVec);

      if (dst) {
        dst.copy(_tmpBox);
        return dst;
      } else {
        return _tmpBox.clone();
      }
    } }, { key: "fillRect", value: function fillRect(


    x, y, w, h) {

      this.updateDBId();

      var xform = this.getCurrentTransform();

      var points = [
      this.tx(x, y, xform), this.ty(x, y, xform),
      this.tx(x + w, y, xform), this.ty(x + w, y, xform),
      this.tx(x + w, y + h, xform), this.ty(x + w, y + h, xform),
      this.tx(x, y + h, xform), this.ty(x, y + h, xform)];


      var c = this.getFillColor();

      var indices = [0, 1, 2, 0, 2, 3];

      // Hack: Assumption here is that the first fillRect call is for the white background quad.
      //       For this, we don't want a dbI and use -1 instead. Unfortunately, this fillRect call happens
      //       inside PDF.js (see beginDrawing in display/canvas.js), so we cannot easily set this id from outside.
      var dbId = this.first ? -1 : this.dbId;

      this.addPolyTriangle(points, indices, c, dbId, this.currentLayerId, false);

      this.first = false;
    } }, { key: "strokeRect", value: function strokeRect(

    x, y, w, h) {
      //TODO:
      console.log("strokeRect");
    } }, { key: "clearRect", value: function clearRect(

    x, y, w, h) {
      console.log("clearRect");
      //TODO:
    } }, { key: "_beginTextChar", value: function _beginTextChar(

    character, x, y, font, fontSize) {
      this.isFontChar = true;
      this.invXform = this.canvasContext.mozCurrentTransformInverse;
      this.hashKey = character.charCodeAt(0) + "/" + font.loadedName + "/" + fontSize;
      this.cachedGlyph = this.glyphCache[this.hashKey];

      if (this.cachedGlyph) {
        this.skipPath = true;
      } else {
        this.skipPath = false;
      }
      //console.log(character, x, y, font, fontSize);
    } }, { key: "drawMSDFText", value: function drawMSDFText(

    character, scaleX, scaleY, font, fontSize) {
      scaleX = 0;
      var fontName = font.name;

      function distance(x0, y0, x1, y1, x2, y2) {
        return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
      }

      if (this.fontAtlas && this.fontAtlas.charsMap && this.fontAtlas.charsMap[fontName]) {
        var charIndex = this.fontAtlas.charsMap[fontName][character.charCodeAt(0)];
        if (charIndex == undefined) {
          return false;
        } else {
          if (this.currentVbb.isFull(4)) {
            this.flushBuffer(0, true);
          }

          this.hasMSDFContent = true;
          var _char = this.fontAtlas.chars[charIndex];
          if (_char.page > 0) {
            // Now only support 1 page of font texture, need to add extra logic for multiple font texture in the shader pipeline
            return false;
          }
          var common = this.fontAtlas.common[_char.common];
          var info = this.fontAtlas.info[_char.info];

          // need to consider the font size
          var scale = fontSize / info.size;
          var w = _char.width * (scale + scaleX);
          var flag = _char.inverseYAxis ? -1 : 1;
          var h = _char.height * (scale + scaleY) * flag;
          var x = _char.txoffset * (scale + scaleX),
          y = _char.tyoffset * (scale + scaleY) * -flag;

          var points = [
          x, y,
          x, y + h,
          x + w, y + h,
          x + w, y];


          var ps = [];
          for (var _i = 0; _i < points.length; _i += 2) {
            ps.push(this.tx(points[_i], points[_i + 1]));
            ps.push(this.ty(points[_i], points[_i + 1]));
          }

          if (_char.inverseYAxis) {
            var uv = [
            _char.x / common.scaleW, 1 - _char.y / common.scaleH,
            _char.x / common.scaleW, 1 - (_char.y + _char.height) / common.scaleH,
            // char.x/common.scaleW, 1- char.y/common.scaleH,
            // (char.x + char.width)/common.scaleW, 1- char.y/common.scaleH,
            (_char.x + _char.width) / common.scaleW, 1 - (_char.y + _char.height) / common.scaleH,
            (_char.x + _char.width) / common.scaleW, 1 - _char.y / common.scaleH];

          } else {
            var uv = [
            _char.x / common.scaleW, 1 - (_char.y + _char.height) / common.scaleH,
            _char.x / common.scaleW, 1 - _char.y / common.scaleH,
            (_char.x + _char.width) / common.scaleW, 1 - _char.y / common.scaleH,
            (_char.x + _char.width) / common.scaleW, 1 - (_char.y + _char.height) / common.scaleH];

          }

          // do a fast clipping for MSDF text, if the text is clipped out any part, will not show the text to make it simple
          // otherwise it requires to do a whole UV mapping for each part left, which is overhead at this moment.
          if (this._curClip) {
            var path = new Path2D(this.precisionTolerance);
            var index = 0;
            path.moveTo(ps[index++], ps[index++]);
            path.lineTo(ps[index++], ps[index++]);
            path.lineTo(ps[index++], ps[index++]);
            path.lineTo(ps[index++], ps[index++]);
            path.closePath();

            var subjFlatted = path.flattened || path.flatten(true);
            var clipFlatted = this._curClip.flattened || this._curClip.flatten(true);
            var precheckResult = path.preCheckForClipping(this, clipFlatted, subjFlatted, false, false);
            if (precheckResult.needClipping) {
              var polygons = path.msdfClipping(clipFlatted);
              var x1 = ps[0],y1 = ps[1];
              var x2 = ps[6],y2 = ps[7];
              var x3 = ps[2],y3 = ps[3];

              var w1 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
              var h1 = Math.sqrt((x3 - x1) * (x3 - x1) + (y3 - y1) * (y3 - y1));
              // need to get the corresponding UV value
              for (var j = 0; j < polygons.length; j++) {
                var polygon = polygons[j];
                if (this.currentVbb.isFull(polygon.vertices.length)) {
                  this.flushBuffer(0, true);
                }
                var _vbase = this.currentVbb.vcount;
                for (var i = 0; i < polygon.vertices.length; i += 2) {
                  var x0 = polygon.vertices[i];
                  var y0 = polygon.vertices[i + 1];
                  var dy = distance(x0, y0, x1, y1, x2, y2);
                  var dx = distance(x0, y0, x1, y1, x3, y3);

                  var u = uv[0] + (uv[4] - uv[0]) * (dx / w1);
                  var v = uv[1] + (uv[5] - uv[1]) * (dy / h1);
                  this.currentVbb.addVertexMSDFPolytriangle(x0, y0, u, v, this.getFillColor(), this.dbId, this.currentLayerId, 0);
                }
                this.currentVbb.addIndices(polygon.indices, _vbase);
              }

              this.currentImage = this.fontAtlas.pages[_char.page];
              return true;
            } else if (precheckResult.needCancel) {
              return true;
            }
          }

          if (this.currentVbb.isFull(4)) {
            this.flushBuffer(0, true);
          }
          var vbase = this.currentVbb.vcount;
          var count = points.length / 2;
          for (var _i2 = 0; _i2 < count; _i2++) {
            this.currentVbb.addVertexMSDFPolytriangle(ps[_i2 * 2], ps[_i2 * 2 + 1], uv[_i2 * 2], uv[_i2 * 2 + 1], this.getFillColor(), this.dbId, this.currentLayerId, 0);
          }

          this.currentVbb.addIndices([0, 2, 1, 0, 2, 3], vbase);
          this.currentImage = this.fontAtlas.pages[_char.page];

          return true;
        }

      } else {
        return false;
      }
    } }, { key: "beginPath", value: function beginPath(

    character, x, y, font, fontSize) {
      this.updateDBId();

      if (typeof character === "string" && font && fontSize) {
        if (this.fontAtlas && this.drawMSDFText(character, x, y, font, fontSize)) {
          this.skipPath = true;
        } else {
          if (this.usingTextLayer === true) {
            this.skipPath = true;
          } else {
            this._beginTextChar(character, x, y, font, fontSize);
          }
        }
      } else {
        this.skipPath = false;
        this.isFontChar = false;
        this.cachedGlyph = null;
      }

      if (this.skipPath)
      this._curPath = null;else
      {
        this._curPath = new Path2D(this.isFontChar ? 0.0001 : this.precisionTolerance);

        // Apply custom tess params (if specified)
        this._curPath.setTessParams(this.tessParams);
      }
    } }, { key: "closePath", value: function closePath()

    {

      if (this.skipPath)
      return;

      this._curPath.closePath();
      this.cachedGlyph = null;
    } }, { key: "moveTo", value: function moveTo(

    x, y) {

      if (this.skipPath)
      return;

      if (!this._curPath)
      this.beginPath();

      var xform = this.getCurrentTransform();

      this._curPath.moveTo(this.tx(x, y, xform), this.ty(x, y, xform));
    } }, { key: "lineTo", value: function lineTo(

    x, y) {

      if (this.skipPath)
      return;

      var xform = this.getCurrentTransform();

      this._curPath.lineTo(this.tx(x, y, xform), this.ty(x, y, xform));
    } }, { key: "arc", value: function arc(

    x, y, radius, startAngle, endAngle, anticlockwise) {

      if (this.skipPath)
      return;

      //TODO: transform

      this._curPath.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    } }, { key: "arcTo", value: function arcTo(

    x1, y1, x2, y2, radius) {

      if (this.skipPath)
      return;

      var xform = this.getCurrentTransform();

      this._curPath.arcTo(this.tx(x1, y1, xform), this.ty(x1, y1, xform),
      this.tx(x2, y2, xform), this.ty(x2, y2, xform),
      this.scaleValue(radius, xform));
    } }, { key: "quadraticCurveTo", value: function quadraticCurveTo(

    cp1x, cp1y, x, y) {

      if (this.skipPath)
      return;

      var xform = this.getCurrentTransform();

      this._curPath.quadraticCurveTo(this.tx(cp1x, cp1y, xform), this.ty(cp1x, cp1y, xform),
      this.tx(x, y, xform), this.ty(x, y, xform));
    } }, { key: "bezierCurveTo", value: function bezierCurveTo(

    cp1x, cp1y, cp2x, cp2y, x, y) {

      if (this.skipPath)
      return;

      var xform = this.getCurrentTransform();

      this._curPath.bezierCurveTo(this.tx(cp1x, cp1y, xform), this.ty(cp1x, cp1y, xform),
      this.tx(cp2x, cp2y, xform), this.ty(cp2x, cp2y, xform),
      this.tx(x, y, xform), this.ty(x, y, xform));
    } }, { key: "rect", value: function rect(

    x, y, w, h) {

      if (this.skipPath)
      return;

      var xform = this.getCurrentTransform();

      if (!this._curPath)
      this.beginPath();

      this._curPath.moveTo(this.tx(x, y, xform), this.ty(x, y, xform));
      this._curPath.lineTo(this.tx(x + w, y, xform), this.ty(x + w, y, xform));
      this._curPath.lineTo(this.tx(x + w, y + h, xform), this.ty(x + w, y + h, xform));
      this._curPath.lineTo(this.tx(x, y + h, xform), this.ty(x, y + h, xform));
      this._curPath.closePath();
    } }, { key: "fill", value: function fill()

    {

      //Special flag passed to us by customization in the pdf.js library,
      //telling us to skip the antialiasing for polygons that are both filled and stroked
      var isFillStrokeCombo = false;
      if (arguments.length) {var _ref;
        var lastArg = (_ref = arguments.length - 1, _ref < 0 || arguments.length <= _ref ? undefined : arguments[_ref]);
        if (typeof lastArg === "boolean") {
          isFillStrokeCombo = lastArg;
        }
      }

      if (this.isFontChar && !this.cachedGlyph) {
        this.glyphCache[this.hashKey] = this._curPath;
        this.cachedGlyph = this._curPath;
        this.cachedGlyph.isFontChar = true;
      }

      this.isFontChar = false;

      if (this.cachedGlyph) {
        this.cachedGlyph.fill(this, this.getFillColor(), this.dbId, this.currentLayerId, this._curClip, true);
      } else {
        this._curPath && this._curPath.fill(this, this.getFillColor(), this.dbId, this.currentLayerId, this._curClip, false, isFillStrokeCombo);
      }

      this.skipPath = false;

      //this._curClip = null;
      //lmvContext._curPath = null;
    } }, { key: "stroke", value: function stroke()

    {
      if (this.isFontChar && !this.cachedGlyph) {
        this.glyphCache[this.hashKey] = this._curPath;
        this.cachedGlyph = this._curPath;
        this.cachedGlyph.isFontChar = true;
      }

      this.updateLineDashStyle();
      this.isFontChar = false;

      // LineShader uses negative lineWidths to indicate screen-space line widths. Note that this.canvasContext.lineWidth does not allow negative values.
      // Therefore, we apply the sign separately.
      var sign = this.isScreenSpace ? -1.0 : 1.0;

      if (this.cachedGlyph) {
        this.cachedGlyph.stroke(this, sign * this.scaleValue(this.canvasContext.lineWidth), this.getStrokeColor(), this.dbId, this.currentLayerId, this._curClip, true, this.lineStyle);
      } else {
        this._curPath && this._curPath.stroke(this, sign * this.scaleValue(this.canvasContext.lineWidth), this.getStrokeColor(), this.dbId, this.currentLayerId, this._curClip, false, this.lineStyle);
      }

      this.skipPath = false;

      //lmvContext._curPath = null;
    } }, { key: "clip", value: function clip(

    param1, param2) {

      if (param2 !== undefined && param1 !== undefined) {
        this._curClip = param1;
        console.log("Probably unsupported use case");
      } else {

        //The clip region is also affected by any existing clip region,
        //i.e. we have to clip the clip.
        if (this._curClip) {
          this._curClip = this._curClip.clip(this._curPath, param1);
        } else {
          this._curClip = this._curPath;
        }

        this._curPath = null;
      }

      //console.log("CLIP", param1, param2);
    } }, { key: "strokeText", value: function strokeText(

    text, x, y, maxWidth, font, fontSize) {

      var ctx = this.canvasContext;
      ctx.save();
      ctx.translate(x, y);

      this.fontEngine.drawText(this, text, 0, 0, font, fontSize);
      this.stroke();

      ctx.restore();
    } }, { key: "fillText", value: function fillText(

    text, x, y, maxWidth, font, fontSize) {

      var ctx = this.canvasContext;
      ctx.save();
      ctx.translate(x, y);

      this.fontEngine.drawText(this, text, 0, 0, font, fontSize);
      this.fill();
      //this.stroke();

      ctx.restore();
    } }, { key: "drawImage", value: function drawImage(

    image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
      if (this.inlineImageGroups && this.inlineImageGroups.map[this.currentOpIndex] != undefined) {
        // means this is an inline image call, we have already have solution for it
        var index = this.inlineImageGroups.map[this.currentOpIndex];
        var group = this.inlineImageGroups.groups[index];
        // if the group has already been rendered, ignore that
        if (group.rendered == true) {
          return;
        } else {
          // mark it as rendered
          group.rendered = true;
        }

        image = group.canvas;
        // need to revert the scale
        var scale = 1 / group.minScale;

        dx = group.bounds.min.x;
        dy = group.bounds.min.y;
        dWidth = image.width / scale;
        dHeight = image.height / scale;

      }

      if (image.width === 0 || image.height === 0) {
        console.warn("Zero size image, skipping");
        return;
      }

      if (dx === undefined) {
        dx = sx;
        dy = sy;
        dWidth = sWidth;
        dHeight = sHeight;
      }

      if (dWidth === undefined) {
        dWidth = image.width;
        dHeight = image.height;
      }

      if (!dWidth) {
        console.warn("Zero size image, skipping");
        return;
      }

      //console.log("Draw image", dWidth, dHeight);

      var xform = this.getCurrentTransform();

      //Get the transformed page space image center
      var cx = this.tx(dx + dWidth / 2, dy + dHeight / 2);
      var cy = this.ty(dx + dWidth / 2, dy + dHeight / 2);

      _mtx4.elements[0] = xform[0];
      _mtx4.elements[1] = xform[1];
      _mtx4.elements[4] = xform[2];
      _mtx4.elements[5] = xform[3];
      _mtx4.elements[12] = xform[4];
      _mtx4.elements[13] = xform[5];
      _mtx4.decompose(_offset, _quat, _scale);

      //Get scaled width/height. Note these scalings can result in negative numbers
      var w = dWidth * _scale.x * this.toPageUnits;
      var h = -dHeight * _scale.y * this.toPageUnits; //Image input is y-down, so we build in a y-inversion

      //Derive the rotation angle by converting the quaternion to axis-angle.
      var s = Math.sqrt(1.0 - _quat.w * _quat.w);
      _axis.set(_quat.x / s, _quat.y / s, _quat.z / s);
      var angle = 2.0 * Math.acos(Math.max(Math.min(1, _quat.w), -1));
      //Take care to negate the angle if the rotation axis is into the page.
      if (_quat.z < 0) {
        angle = -angle;
      }

      //Angle needs to be in the range 0-2pi for use by addTextureQuad below,
      //while input has domain [-pi, pi].
      if (angle < 0) {
        angle += 2 * Math.PI;
      }

      this.flushBuffer(0, true);
      this.currentVbb.addTexturedQuad(cx, cy, w, h, angle, 0xffff00ff, 0, this.currentLayerId, 0);
      this.currentImage = image;
      this.flushBuffer(0, true, QUAD_TEXTURE);

      //        console.log("draw Image", sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    /**
       * Mapping back the reference object to its value, and loop 1 level in
       * @param {Object} properties 
       */ }, { key: "_processProperties", value: function _processProperties(
    properties) {
      if (LmvCanvasContext.isRef(properties)) {
        properties = this.pdfRefMap[LmvCanvasContext.refKey(properties)];
      }

      for (var key in properties) {
        if (LmvCanvasContext.isRef(properties[key])) {
          properties[key] = this.pdfRefMap[LmvCanvasContext.refKey(properties[key])];
        }
      }
      return properties;
    } }, { key: "beginMarkedContent", value: function beginMarkedContent(

    properties) {
      if (properties) {
        properties = this._processProperties(properties);
      }

      // Revit will provided tag as number
      var tag = properties.name || properties.DBID;
      if (!isNaN(tag)) {
        this.taggedId = parseInt(tag);
      } else {
        this.taggedId = null;
      }

      if (this.taggedId != null && this.dbId != this.taggedId) {
        this.updateDBId();
      }

      if (properties.VP) {
        this.currentVpId = this.viewports.length;
        this.viewports.push(this.createViewPortData(JSON.parse(properties.VP), properties.UNITS));
      }

      this.ocgStack.push({
        taggedId: this.taggedId,
        viewPortId: this.currentVpId });

    } }, { key: "beginMarkedContentProps", value: function beginMarkedContentProps(

    tag, properties) {
      if (properties) {
        properties = this._processProperties(properties);
      }

      if (tag === "OC") {
        var ocgId = properties.ocgId;
        var layerId = this.layers[ocgId];
        if (layerId == undefined) {
          layerId = this.defaultLayerId;
        }
        this.currentLayerId = layerId;

        this.ocgStack.push({
          layerId: this.currentLayerId });

      } else {
        if (!isNaN(tag)) {
          this.taggedId = parseInt(tag);
          if (this.dbId != this.taggedId) {
            this.updateDBId();
          }
        }
        if (properties) {
          if (properties.VP) {
            this.currentVpId = this.viewports.length;
            this.viewports.push(this.createViewPortData(JSON.parse(properties.VP), properties.UNITS));
          }

          this.ocgStack.push({
            viewPortId: this.currentVpId,
            taggedId: this.taggedId });

        } else {
          this.ocgStack.push({});

        }
      }
    } }, { key: "endMarkedContent", value: function endMarkedContent()

    {
      var previousState = this.ocgStack.pop();
      var previousTagId = this.taggedId;
      if (previousState) {
        // reset the state
        if (previousState.taggedId != null) {
          this.taggedId = null;
        }
        if (previousState.layerId) {
          this.currentLayerId = this.defaultLayerId;
        }
        if (previousState.viewPortId) {
          this.currentVpId = this.defaultVPId;
        }
      }

      if (this.ocgStack.length > 0) {
        var state = this.ocgStack[this.ocgStack.length - 1];
        if (state.taggedId != null) {
          this.taggedId = state.taggedId;
        }
        if (state.currentLayerId != null) {
          this.currentLayerId = state.currentLayerId;
        }
        if (state.viewPortId != null) {
          this.currentVpId = state.viewPortId;
        }
      } else {
        this.currentLayerId = this.defaultLayerId;
        this.taggedId = null;
        this.currentVpId = this.defaultVPId;
      }

      if (previousTagId != this.taggedId) {
        this.updateDBId();
      }
    } }, { key: "setLineStyleParam", value: function setLineStyleParam(

    param) {
      if (!this.lineStyleInitialized) {
        // Add those default definition in, to keep the app constent.
        var exH = avp.LineStyleDefs.length;
        var exW = 1;
        for (var i = 0; i < avp.LineStyleDefs.length; i++) {
          exW = Math.max(avp.LineStyleDefs[i].def.length, exW);
        }var _avp$createLinePatter =

        avp.createLinePatternTextureData(Math.max(param.width, exW), param.height + exH + 1),tex = _avp$createLinePatter.tex,pw = _avp$createLinePatter.pw,lineStyleTex = _avp$createLinePatter.lineStyleTex;
        this.lineStyleIndex = 0;
        this.lineStylePw = pw;
        this.lineStyleTexData = tex;
        this.lineStyleTexture = lineStyleTex;
        this.lineStyleIndexMap = {};

        for (var i = 0; i < avp.LineStyleDefs.length; i++) {
          this.addNewDashedLineStyle(avp.LineStyleDefs[i], 96);
        }

        // set the default value
        this.lineStyle = 0;
        this.lineStyleInitialized = true;
      }
    } }, { key: "addNewDashedLineStyle", value: function addNewDashedLineStyle(

    ls, dpi) {
      var key = ls.def.join("/");
      if (this.lineStyleIndexMap[key] != undefined) {
        return this.lineStyleIndexMap[key];
      } else {
        avp.createLinePatternForDef(ls, this.lineStyleTexData, this.lineStyleIndex, this.lineStylePw, dpi);
        var index = this.lineStyleIndex;
        this.lineStyleIndexMap[key] = index;
        this.lineStyleIndex++;

        return index;
      }
    } }, { key: "setLineDash", value: function setLineDash(

    def) {
      if (!this.lineStyleInitialized) {
        this.setLineStyleParam({ width: 5, height: 4 });
      }

      this.lineDashedDef = def;
    } }, { key: "createPattern", value: function createPattern(

    image, repetition) {
      var pattern = this.canvasContext._originalcreatePattern(image, repetition);
      pattern.image = image;
      pattern.repetition = repetition;
      pattern.isPattern = true;
      return pattern;
    } }, { key: "updateLineDashStyle", value: function updateLineDashStyle()

    {
      // need apply the transformation matrix to the dashed value
      var def = this.lineDashedDef;

      if (def) {
        if (def.length > 0) {
          var xform = this.getCurrentTransform();
          var def1 = [];
          for (var i = 0; i < def.length; i++) {
            var x = (def[i] * xform[0] + def[i] * xform[2]) * this.toPageUnits;
            x = parseFloat(x.toFixed(6));
            def1.push(x);
          }
          // 96 DPI was defined for lineStyleDef.js, and shader were expecting that value
          // when we parse the pdf, the effective dpi need to be ==> 96 / 72 / this.toPageUnits
          this.lineStyle = this.addNewDashedLineStyle({ def: def1 }, 96 / 72 / this.toPageUnits);
        } else {
          this.lineStyle = 0;
        }
      }
      // In case of user directly controlled the line style
      // Do not set lineStyle to 0 here.
    } }, { key: "setCircleInfo", value: function setCircleInfo(

    circleInfo) {
      this.circleInfo = circleInfo;
    } }, { key: "setCurrentOperatorIndex", value: function setCurrentOperatorIndex(

    index) {
      this.currentOpIndex = index;
      if (this.circleInfo && this.circleInfo[index]) {
        var xform = this.getCurrentTransform();
        var x = this.tx(this.circleInfo[index][0], this.circleInfo[index][1], xform);
        var y = this.ty(this.circleInfo[index][0], this.circleInfo[index][1], xform);

        // Inject the center of the circle
        var hiddenColor = 0x01ffffff; // Note that lineShader discards fully transparent fragments. Therefore, we use a white here with very small, but nonzero alpha.
        var c = this.currentVbb.addVertexLine(x, y, 0, 0.0001, 0, 0, hiddenColor, this.dbId, this.currentLayerId, this.currentVpId);
        this.currentVbb.finalizeQuad(c);
      }
    }

    /**
       * We have fuge performance issue when the PDF contains inline image group
       * And each line will call a drawImage, with the whole texture enabled
       * It causes OOM and slow down the whole rendering
       * In order to boost the performance, we need to do a preprocess to combine those scane line images
       * Once, we have that information, we ignore the draw call for those images,
       * this function is the entry point to pass those preprocessed image in to the drawing context
       * LMV-5175
       * 
       * @param {Object} imageGroups 
       */ }, { key: "setInlineImageGroups", value: function setInlineImageGroups(
    imageGroups) {
      if (imageGroups && imageGroups.groups.length > 0) {
        this.inlineImageGroups = imageGroups;
      }
    } }, { key: "needDelegateInlineImageGroup", value: function needDelegateInlineImageGroup()

    {
      var hasGroup = this.inlineImageGroups && this.inlineImageGroups.map[this.currentOpIndex] != undefined;
      return hasGroup;
    }

    // Set custom tesselation params for bezier arcs (see Bezier.h)
    // If undefined, we use the default settings.
  }, { key: "setTessParams", value: function setTessParams(tessParams) {
      this.tessParams = tessParams;
    } }, { key: "finish", value: function finish()

    {
      this.flushBuffer(0, true);
      this.fontAtlas = null;
    } }, { key: "createViewPortData", value: function createViewPortData(

    matrix, units) {
      return {
        "units": units || "feet and inches",
        "transform": matrix,
        "geom_metrics": this.initGeomMetrics() };

    } }, { key: "isLMVCanvasContext", value: function isLMVCanvasContext()

    {
      return true;
    }

    //Initializes a structure of counters used for statistical purposes and sheet content hash
  }, { key: "initGeomMetrics", value: function initGeomMetrics() {
      return {
        "arcs": 0,
        "circles": 0,
        "circ_arcs": 0,
        "viewports": 0,
        "clips": 0,
        "colors": 0,
        "db_ids": 0,
        "dots": 0,
        "fills": 0,
        "layers": 0,
        "line_caps": 0,
        "line_joins": 0,
        "line_patterns": 0,
        "line_pat_refs": 0,
        "plines": 0,
        "pline_points": 0,
        "line_weights": 0,
        "links": 0,
        "miters": 0,
        "ptris": 0,
        "ptri_indices": 0,
        "ptri_points": 0,
        "rasters": 0,
        "texts": 0,
        "strings": [] };

    } }]);return LmvCanvasContext;}();