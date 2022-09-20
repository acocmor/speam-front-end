
import { SetTesselationParams } from "./bezier";

//Copied from pdf.js, because our 2D renderer relies on mozCurrentTransform being available
export function addContextCurrentTransform(ctx) {
  if (!ctx.mozCurrentTransform) {
    ctx._originalSave = ctx.save;
    ctx._originalRestore = ctx.restore;
    ctx._originalRotate = ctx.rotate;
    ctx._originalScale = ctx.scale;
    ctx._originalTranslate = ctx.translate;
    ctx._originalTransform = ctx.transform;
    ctx._originalSetTransform = ctx.setTransform;
    ctx._transformMatrix = ctx._transformMatrix || [1, 0, 0, 1, 0, 0];
    ctx._transformStack = [];
    Object.defineProperty(ctx, 'mozCurrentTransform', {
      get: function getCurrentTransform() {
        return this._transformMatrix;
      } });

    Object.defineProperty(ctx, 'mozCurrentTransformInverse', {
      get: function getCurrentTransformInverse() {
        var m = this._transformMatrix;
        var a = m[0],
        b = m[1],
        c = m[2],
        d = m[3],
        e = m[4],
        f = m[5];
        var ad_bc = a * d - b * c;
        var bc_ad = b * c - a * d;
        return [d / ad_bc, b / bc_ad, c / bc_ad, a / ad_bc, (d * e - c * f) / bc_ad, (b * e - a * f) / ad_bc];
      } });

    ctx.save = function ctxSave() {
      var old = this._transformMatrix;
      this._transformStack.push(old);
      this._transformMatrix = old.slice(0, 6);
      this._originalSave();
    };
    ctx.restore = function ctxRestore() {
      var prev = this._transformStack.pop();
      if (prev) {
        this._transformMatrix = prev;
        this._originalRestore();
      }
    };
    ctx.translate = function ctxTranslate(x, y) {
      var m = this._transformMatrix;
      m[4] = m[0] * x + m[2] * y + m[4];
      m[5] = m[1] * x + m[3] * y + m[5];
      this._originalTranslate(x, y);
    };
    ctx.scale = function ctxScale(x, y) {
      var m = this._transformMatrix;
      m[0] = m[0] * x;
      m[1] = m[1] * x;
      m[2] = m[2] * y;
      m[3] = m[3] * y;
      this._originalScale(x, y);
    };
    ctx.transform = function ctxTransform(a, b, c, d, e, f) {
      var m = this._transformMatrix;
      this._transformMatrix = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]];
      ctx._originalTransform(a, b, c, d, e, f);
    };
    ctx.setTransform = function ctxSetTransform(a, b, c, d, e, f) {
      this._transformMatrix = [a, b, c, d, e, f];
      ctx._originalSetTransform(a, b, c, d, e, f);
    };
    ctx.rotate = function ctxRotate(angle) {
      var cosValue = Math.cos(angle);
      var sinValue = Math.sin(angle);
      var m = this._transformMatrix;
      this._transformMatrix = [m[0] * cosValue + m[2] * sinValue, m[1] * cosValue + m[3] * sinValue, m[0] * -sinValue + m[2] * cosValue, m[1] * -sinValue + m[3] * cosValue, m[4], m[5]];
      this._originalRotate(angle);
    };
  }
}


function polygonVerts(N, radius, phase) {

  var res = [];
  radius = radius || 1;
  phase = phase || 0;

  for (var angle = phase; angle < 360 + phase; angle += 360 / N) {

    var a = angle * Math.PI / 180;
    var x = radius * Math.cos(a);
    var y = radius * Math.sin(a);

    res.push(x);
    res.push(y);

  }

  return res;
}


function drawPolygon(ctx, x, y, N, R, phase) {
  var pts = polygonVerts(N, R, phase);

  ctx.beginPath();
  ctx.moveTo(pts[0] + x, pts[1] + y);

  for (var i = 2; i < pts.length; i += 2) {
    ctx.lineTo(pts[i] + x, pts[i + 1] + y);
  }

  ctx.closePath();
}

function drawStarPolygon(ctx, x, y, N, R, phase) {

  var pts = polygonVerts(N, R, phase);

  ctx.beginPath();
  ctx.moveTo(pts[0] + x, pts[1] + y);

  var count = 0;
  var next = 2;
  var total = pts.length / 2;
  while (count < total) {

    ctx.lineTo(pts[2 * next] + x, pts[2 * next + 1] + y);

    next += 2;
    next = next % total;
    count++;
  }

  ctx.closePath();

}


export function generateTestPattern(ctx) {

  //Long text strings used in this test need dense tesselation setting compared to their bounding box
  SetTesselationParams(300, 0.005);

  var c = ctx.canvasContext;

  addContextCurrentTransform(c);

  //1. Draw the page
  c.fillStyle = "rgba(255, 255, 255, 1)";
  var vp = ctx.viewport;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(vp.width, 0);
  ctx.lineTo(vp.width, vp.height);
  ctx.lineTo(0, vp.height);
  ctx.closePath();
  ctx.fill();

  c.strokeStyle = "rgba(0, 0, 0, 1)";

  //Simple polygon
  c.fillStyle = "rgba(3, 137, 255, 1)";
  drawPolygon(ctx, 120, 50, 5, 30, 90);
  ctx.fill();
  ctx.stroke();

  //Self-intersecting polygon
  c.fillStyle = "rgba(255, 95, 3, 1)";
  drawStarPolygon(ctx, 190, 50, 5, 30, 90);
  ctx.fill();
  ctx.stroke();

  //Simple polygon
  c.fillStyle = "rgba(255, 255, 0, 1)";
  drawPolygon(ctx, 240, 350, 7, 30, 0);
  ctx.fill();
  ctx.stroke();

  //Self-intersecting polygon
  c.fillStyle = "rgba(90, 255, 123, 1)";
  drawStarPolygon(ctx, 310, 350, 7, 30, 0);
  ctx.fill();

  ctx.stroke();

  //Text
  c.fillStyle = "rgba(66, 66, 66, 1)";
  c.save();
  c.translate(50, 150);
  c.scale(1, -1);
  ctx.fillText("The quick brown", 0, 0, 800, { name: "Arial" }, 24);
  c.restore();

  c.save();
  c.translate(50, 186);
  c.scale(1, -1);
  ctx.fillText("fox jumps", 0, 0, 800, { name: "Courier" }, 72);
  c.restore();

  c.save();
  c.translate(50, 350);
  c.scale(1, -1);
  c.rotate(13);
  ctx.fillText("over the lazy dog.", 0, 0, 800, { name: "Times" }, 36);
  c.restore();

  //Polygon clipping
  c.fillStyle = "rgba(91, 167, 255, 1)";
  c.save();

  //Draw a pentagon and use it as clip region also
  drawPolygon(ctx, 150, 450, 5, 30, 90);
  ctx.fill();
  ctx.stroke();
  ctx.clip();

  //Fill a hexagon, taking into account the clip region
  c.fillStyle = "rgba(255, 167, 91, 1)";
  drawPolygon(ctx, 170, 450, 6, 30, 90);
  ctx.fill();

  //Stroke the hexagon -- currently this will not work (i.e. it will draw the outline unclipped)
  c.strokeStyle = "rgba(255, 0, 0, 1)";
  ctx.stroke();

  c.restore();


}