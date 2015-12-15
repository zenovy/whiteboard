angular.module('whiteboard.services.inputhandler', [])
.factory('InputHandler', ['BoardData','Snap', 'EventHandler', 'Broadcast', function (BoardData, Snap, EventHandler, Broadcast) {
  var eraserOn;
  function toggleEraser () {
    eraserOn ? eraserOn = false : eraserOn = true;
  }

  function getMouseXY (ev) {
    var canvasMarginXY = BoardData.getCanvasMargin();
    var scalingFactor = BoardData.getZoomScale();
    var offsetXY = BoardData.getOffset();
    return {
      x: (ev.clientX - canvasMarginXY.x) * scalingFactor + offsetXY.x,
      y: (ev.clientY - canvasMarginXY.y) * scalingFactor + offsetXY.y
    };
  }

  function mouseDown (ev) {
    var currentShape = BoardData.getCurrentShape();

    var currentTool = BoardData.getCurrentTool();
    var socketID = BoardData.getSocketID();

    if (currentShape && currentShape.type === 'text') {
      // !!! boardCtrl.finishShape();
    } else if (currentTool.name === 'eraser') {
      toggleEraser();
    } else if (currentTool.name === 'move') {
      var shape = BoardData.getBoard().getElementByPoint(ev.clientX, ev.clientY);
      if (shape) {
        BoardData.setEditorShape(shape);
      }
    } else {
      // !!! boardCtrl.createShape(ev);
      var id = BoardData.generateShapeID();
      var mouseXY = getMouseXY(ev);

      //this snaps the initial point to any available snapping points
      var coords = Snap.snapToPoints(mouseXY.x, mouseXY.y, 15);

      // broadcast to server
      Broadcast.newShape(id, currentTool.name, coords, currentTool.colors);
    }

  }

  function mouseMove (ev) {
    var currentTool = BoardData.getCurrentTool();
    var socketID = BoardData.getSocketID();
    var id = BoardData.getCurrentShapeID();
    var currentShape = BoardData.getCurrentShape();

    if (currentTool.name === 'move') {
      var currentEditorShape = BoardData.getEditorShape();
      if (currentEditorShape) {
        var mouseXY = getMouseXY(ev);
        EventHandler.moveShape(currentEditorShape.id, socketId, mouseXY.x, mouseXY.y)
      }
    } else if (currentShape) {
      var mouseXY = getMouseXY(ev);
      Broadcast.editShape(id, socketID, currentTool, mouseXY.x, mouseXY.y);
      EventHandler.editShape(id, socketID, currentTool, mouseXY.x, mouseXY.y);
      //BROADCAST
    } else if (currentTool.name === 'eraser' && eraserOn) {
      var shape = BoardData.getBoard().getElementByPoint(ev.clientX, ev.clientY);
      if (shape) {
        EventHandler.deleteShape(shape.id, socketID);
      }
    }
  }

  function mouseUp (ev) {
    var currentTool = BoardData.getCurrentTool();
    var socketID = BoardData.getSocketID();
    var id = BoardData.getCurrentShapeID();
    var currentShape = BoardData.getCurrentShape();
    
    if (currentShape && currentShape.type !== 'text') {
      EventHandler.finishShape(id, socketID, currentTool);
      BoardData.unsetCurrentShape();
      //BROADCAST
    } else if (BoardData.getEditorShape()) {
        BoardData.unsetEditorShape();
    } else if (currentTool.name === 'eraser') {
      toggleEraser();
    }
    Broadcast.finishShape(id, currentTool);
  }

  function doubleClick (ev) {
    // !!! boardCtrl.zoom(ev);
  }

  return {
    mousedown: mouseDown,
    mousemove: mouseMove,
    mouseup: mouseUp,
    dblclick: doubleClick
  };
}]);
