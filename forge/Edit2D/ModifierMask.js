function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}function _createClass(Constructor, protoProps, staticProps) {if (protoProps) _defineProperties(Constructor.prototype, protoProps);if (staticProps) _defineProperties(Constructor, staticProps);return Constructor;} // Helper to check whether certain modifiers are currently hold or not.
// See https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/getModifierState for list of supported keys.
// E.g.:
//  "Control", "Shift", "Alt", ..
var ModifierMask = /*#__PURE__*/function () {

  function ModifierMask() {_classCallCheck(this, ModifierMask);
    // By default, don't check any modifers.
    this.checkedModifiers = {};
  }

  // Add a modifier to be checked. E.g. addCondition("Control", true).
  _createClass(ModifierMask, [{ key: "addCondition", value: function addCondition(modifierName, expectedState) {
      this.checkedModifiers[modifierName] = expectedState;
    }

    // Remove condition - accept any state of this modifier
  }, { key: "removeCondition", value: function removeCondition(modifierName) {
      delete this.checkedModifiers[modifierName];
    }

    // Check if current event meets all modifier conditions
  }, { key: "accepts", value: function accepts(event) {
      for (var key in this.checkedModifiers) {
        var state = event.getModifierState(key);
        var expected = this.checkedModifiers[key];
        if (state !== expected) {
          return false;
        }
      }
      return true;
    } }]);return ModifierMask;}();export { ModifierMask as default };
;