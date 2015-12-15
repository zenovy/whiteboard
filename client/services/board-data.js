angular.module('whiteboard.services.boarddata', [])
.factory('BoardData', function () {
  //svgWidth/Height are the width and height of the DOM element
  var svgWidth = 400; //sizeX
  var svgHeight = 400; //sizeY
  //offsetX/Y measure the top-left point of the viewbox
  var offsetX = 0;
  var offsetY = 0;
  //scalingFactor is the level of zooming relative to the start
  var scalingFactor = 1;

  var board;
  var $canvas;
  //canvasMarginX/Y are the left and top margin of the SVG in the browser
  var canvasMarginX; //canvasX
  var canvasMarginY; //canvasY
  //viewBoxWidth/Height are needed for zooming
  var viewBoxWidth = svgWidth;
  var viewBoxHeight = svgHeight;

  var shapeStorage = {};
  var currentShape;
  var editorShape;
  var socketID;
  var _counter = 0;

  var tool = {
    name: 'path',
    colors: {
      fill: 'transparent',
      stroke: '#000000'
    }
  };

  //-----------------
  //utility functions

  function createBoard (element) {
    board = Raphael(element[0], svgWidth, svgHeight);
    $canvas = element.find('svg');
    canvasMarginX = $canvas.position().left;
    canvasMarginY = $canvas.position().top;
    viewBoxWidth = svgWidth;
    viewBoxHeight = svgHeight;
  }

  function generateShapeID () {
    return _counter++;
  }

  function getShapeByID (id, socketID) {
    return shapeStorage[socketID][id];
  }

  function getCurrentShapeID () {
    return _counter - 1;
  }

  function pushToStorage (id, socketID, shape) {
    if (!shapeStorage[socketID]) {
      shapeStorage[socketID] = {};
    }
    shapeStorage[socketID][id] = shape;
  }

  //-----------------------
  //static property getters

  function getBoard () {
    return board;
  }

  function getOriginalDims () {
    return {
      width: svgWidth,
      height: svgHeight
    };
  }

  function getCanvas () {
    return $canvas;
  }

  function getCanvasMargin () {
    return {
      x: canvasMarginX,
      y: canvasMarginY
    };
  }

  //-----------------------
  //property getter/setters

  function getViewBoxDims () {
    return {
      width: viewBoxWidth,
      height: viewBoxHeight
    };
  }

  function setViewBoxDims (newViewBoxDims) {
    viewBoxWidth = newViewBoxDims.width;
    viewBoxHeight = newViewBoxDims.height;
  }

  function getOffset () {
    return {
      x: offsetX,
      y: offsetY
    }
  }

  function setOffset (newOffset) {
    offsetX = newOffset.x;
    offsetY = newOffset.y;
  }

  function getZoomScale () {
    return scalingFactor;
  }

  function setZoomScale (scale) {
    scalingFactor = 1 / scale;
  };

  function getSocketID () {
    return socketID;
  }

  function setSocketID (id) {
    socketID = id;
  }

  //------------
  //tool methods

  function getCurrentTool () {
    return tool;
  }

  function setCurrentToolName (name) {
    tool.name = name;
  }

  function setColors (fill, stroke) {
    tool.colors.fill = fill;
    tool.colors.stroke = stroke; 
  }

  //
  //focused shape getter/setters

  function getEditorShape () {
    return editorShape;
  }

  function setEditorShape (shape) {
    editorShape = shapeStorage[socketID][shape.id];
  }

  function unsetEditorShape () {
    editorShape = null;
  }

  function getCurrentShape () {
    return currentShape;
  }

  function setCurrentShape () {
    currentShape = shapeStorage[socketID][_counter - 1];
  }

  function unsetCurrentShape () {
    currentShape = null;
  }

  return {
    //utility functions
    createBoard: createBoard,
    generateShapeID: generateShapeID,
    getShapeByID: getShapeByID,
    getCurrentShapeID: getCurrentShapeID,
    pushToStorage: pushToStorage,

    //static property getters
    getBoard: getBoard,
    getOriginalDims: getOriginalDims,
    getCanvas: getCanvas,
    getCanvasMargin: getCanvasMargin,
    
    //property getter/setters
    getViewBoxDims: getViewBoxDims,
    setViewBoxDims: setViewBoxDims,
    getOffset: getOffset,
    setOffset: setOffset,
    getZoomScale: getZoomScale,
    setZoomScale: setZoomScale,
    getSocketID: getSocketID,
    setSocketID: setSocketID,
    
    //tool methods
    getCurrentTool: getCurrentTool,
    setColors: setColors,
    setCurrentToolName: setCurrentToolName,

    //focused shape getters/setters
    getCurrentShape: getCurrentShape,
    setCurrentShape: setCurrentShape,
    unsetCurrentShape: unsetCurrentShape,
    getEditorShape: getEditorShape,
    setEditorShape: setEditorShape,
    unsetEditorShape: unsetEditorShape
  }
});
