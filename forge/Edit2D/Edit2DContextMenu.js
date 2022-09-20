function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;}var Edit2DContextMenu = /*#__PURE__*/function () {

  // @param {ToolSet} toolSet (see Edit2D.js)
  function Edit2DContextMenu(viewer, toolSet) {_classCallCheck(this, Edit2DContextMenu);

    this.viewer = viewer;
    this.toolSet = toolSet;

    // Define ContextMenu callback
    this.callbackId = "Edit2D_".concat(toolSet.name);
    this.callback = this.onContextMenu.bind(this);
  }_createClass(Edit2DContextMenu, [{ key: "register", value: function register()

    {
      this.viewer.registerContextMenuCallback(this.callbackId, this.callback);
    } }, { key: "unregister", value: function unregister()

    {
      this.viewer.unregisterContextMenuCallback(this.callbackId);
    }

    // Note that editTool.getVertexIndex() does not work if a context menu is already open.
    // Reason is that the evens are all consumed by an invisible full-screen-div, so that a
    // gizmos cannot detect anymore if the mouse is on it.
  }, { key: "vertexGizmoUnderMouse", value: function vertexGizmoUnderMouse(clientX, clientY) {

      // get vertex gizmos from EditTool
      var editTool = this.toolSet.tools.polygonEditTool;
      var gizmos = editTool.vertexGizmos;

      // Check element under mouse
      var elem = document.elementFromPoint(clientX, clientY);

      // Check if it matches with any vertex gizmo
      return gizmos.findIndex(function (g) {return g.container === elem;});
    }

    // Define callback to modify the viewer context menu
    //  @param {Object[]} menuItems - items to be modified
    //  @param {Object}   status    - ObjectContextMenu.js
  }, { key: "onContextMenu", value: function onContextMenu(menu, status) {

      var editTool = this.toolSet.tools.polygonEditTool;
      var layer = this.toolSet.context.layer;
      var event = status.event;

      // Check if a shape is selected for editing
      var shapeSelected = Boolean(editTool.poly);
      if (!shapeSelected) {
        // If not, keep original viewer context menu
        return;
      }

      // get mouse pos in layer coords
      var mousePos = layer.canvasToLayer(status.canvasX, status.canvasY);

      // Check if we hit a vertex gizmo. Note that a VertexGizmo exceeds the actual shape.
      var vertex = this.vertexGizmoUnderMouse(event.clientX, event.clientY);
      var mouseOnGizmo = vertex >= 0;

      // Check if "insert vertex" is possible at the current position
      var edgeIndex = editTool.findEdgeUnderMouse(mousePos);
      var newVertexPos = editTool.getNewVertexPosition(mousePos, edgeIndex);
      var mouseCloseToEdge = Boolean(newVertexPos);

      // If the mouse is neither on a shape nor on a vertex gizmo, exist here.
      // Note that the gizmos exceed the actual shape by a few pixels, so we may hit one without hitting the shape.
      var mouseOnShape = layer.hitTest(mousePos.x, mousePos.y);
      if (!mouseOnShape && !mouseOnGizmo && !mouseCloseToEdge) {
        // When clicking somewhere else, leave default context menu
        return;
      }

      // If a polygon is selected for editing, we hijack the menu completely and remove the 
      // viewer default stuff (Show all layers etc.) - assuming that the user is focusing on 2D editing.
      menu.length = 0;

      // If so, add RemoveVertex item
      if (mouseOnGizmo) {
        menu.push({
          title: 'Remove Vertex',
          target: function target() {
            editTool.removePoint(vertex);
          } });

      } else if (newVertexPos) {
        // Add "Insert Vertex" menu item
        menu.push({
          title: 'Insert Vertex',
          target: function target() {
            // insert new vertex after edge starting point
            var newVertex = edgeIndex + 1;
            editTool.insertPoint(newVertex, newVertexPos);
          } });

      }
    } }]);return Edit2DContextMenu;}();export { Edit2DContextMenu as default };