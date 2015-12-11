angular.module('whiteboard')
.directive('wbBoard', [ 'ShapeBuilder', function (ShapeBuilder) {
  return {
    restrict: 'A',
    require: ['wbBoard'],
    replace: true,
    template: 
      '<div id="board-container">' +
      '   <div wb-toolbar></div>' +
      '</div>',
    controller: function ($scope, ShapeEditor, Snap, Broadcast) {
      $scope.paper = {}
      $scope.tool = {
        name: null,
        fill: 'red'
      };
      $scope.selectedShape = {};

      this.clEvent = function (ev) {
        //console.log('Event: ', ev.type);
      };
      this.setToolName = function (tool) {
        $scope.tool.name = tool; 
      };

      this.setColor = function (val) {
        $scope.tool.fill = val; 
      };

      this.setZoomScale = function (scale) {
        $scope.paper.scalingFactor = 1 / scale;
        this.zoom();
      };

      this.zoom = function (ev) {
        var paper = $scope.paper;
        
        var originalWidth = paper.width;
        var originalHeight = paper.height;

        if (ev) {
          var mousePosition = {
            x: (ev.clientX - paper.canvasX) * paper.scalingFactor + paper.offsetX,
            y: (ev.clientY - paper.canvasY) * paper.scalingFactor + paper.offsetY
          };
        }

        paper.width = paper.sizeX * paper.scalingFactor;
        paper.height = paper.sizeY * paper.scalingFactor;
        if (ev) {
          paper.offsetX = mousePosition.x - paper.width / 2;
          paper.offsetY = mousePosition.y - paper.height / 2;
        } else {
          paper.offsetX = paper.offsetX + originalWidth / 2 - paper.width / 2;
          paper.offsetY = paper.offsetY + originalHeight / 2 - paper.height / 2;
        }
        ShapeBuilder.raphael.setViewBox(paper.offsetX, paper.offsetY, paper.width, paper.height);
      };

      this.createShape = function (ev) {
        var mousePosition = {
          x: (ev.clientX - $scope.paper.canvasX) * $scope.paper.scalingFactor + $scope.paper.offsetX,
          y: (ev.clientY - $scope.paper.canvasY) * $scope.paper.scalingFactor + $scope.paper.offsetY
        };

        $scope.selectedShape.id = ShapeBuilder.generateShapeId();
        
        var coords = ShapeBuilder.setShape($scope.paper, mousePosition);
        $scope.selectedShape.el = ShapeBuilder.newShape($scope.tool.name, coords.initX, coords.initY, $scope.tool.fill);

        // broadcast to server
        Broadcast.newShape($scope.selectedShape.id, $scope.tool.name, coords);

        $scope.selectedShape.coords = coords;

        ShapeBuilder.storeOnEditShape(Broadcast.getSocketId(), $scope.selectedShape);
      };

      this.editShape = function (ev) {
        var mousePosition = {
          x: (ev.clientX - $scope.paper.canvasX) * $scope.paper.scalingFactor + $scope.paper.offsetX,
          y: (ev.clientY - $scope.paper.canvasY) * $scope.paper.scalingFactor + $scope.paper.offsetY
        };

        var infoForClient = {
          shape: $scope.selectedShape.el,
          coords: $scope.selectedShape.coords,
          initCoords: $scope.paper,
          fill: $scope.tool.fill
        };
        var infoForServer = {
          shapeId: $scope.selectedShape.id,
          tool: $scope.tool.name,
          coords: $scope.selectedShape.coords,
          initCoordX: $scope.paper.canvasX,
          initCoordY: $scope.paper.canvasY,
          fill: $scope.tool.fill
        };
  
        ShapeEditor.selectShapeEditor($scope.tool.name, infoForClient, mousePosition);
        // broadcast to server
        Broadcast.selectShapeEditor(infoForServer, mousePosition);
      };
      this.finishShape = function () {
        var paper = $scope.selectedShape.el.paper;
        function roundness (pathStr) {
          function createPointsFromPath (pathStr) {
            var samplingRate = 0.02;
            var points = [];
            var pathLength = Raphael.getTotalLength(pathStr);
            for (var i = 0; i < 1; i += samplingRate) {
              points.push(Raphael.getPointAtLength(pathStr, pathLength * i));
            }
            return points;
          }

          var points = createPointsFromPath(pathStr);

          var arrowSize = 10;
          var offsetY = 150;
          var culmX = 0;
          var culmY = 0;
          points.forEach(function (point, index, points) {
            if (index === points.length - 1) return;
            var p0 = points[index];
            var p1 = points[index + 1];
            var dx = p1.x - p0.x;
            var dy = p1.y - p0.y;
            point.angle = Math.atan2(dy, dx);
            if (index !== 0) {
              point.angle = (points[index - 1].angle + point.angle) / 2;
            }

            var endX = point.x + arrowSize * Math.cos(point.angle);
            var endY = point.y + arrowSize * Math.sin(point.angle);
            var arrowStart = 'M' + point.x + ',' + (point.y + offsetY);
            var arrowEnd = 'L' + endX + ',' + (endY + offsetY);
            paper.path(arrowStart + arrowEnd);
            paper.circle(endX, endY + offsetY, 1)
          });
          var angleDiff = points.map(function (point, index, points){
            if (index === points.length - 1) return;
            var diff = Math.abs((points[index + 1].angle - points[index].angle) * 180 / Math.PI).toFixed(2);
            return diff > 345 || diff < 15;
          });
          console.log(angleDiff);

          // var samplingRate = 0.01;
          // var points = [];
          // var pathLength = Raphael.getTotalLength(path);
          // for (var i = 0; i < 1; i += samplingRate) {
          //   points.push(Raphael.getPointAtLength(path, pathLength * i));
          // }
          // var cx = points.reduce(function (sum, point) {
          //   return sum += point.x;
          // }, 0) / points.length;
          // var cy = points.reduce(function (sum, point) {
          //   return sum += point.y;
          // }, 0) / points.length;
          // var PolarPoint = function (x, y) {
          //     this.r = Math.sqrt(Math.pow(x - cx,2) + Math.pow(y - cy,2));
          //     this.theta = Math.atan2((y - cy),(x - cx));
          // };

          // var polarPoints = points.map(function (point) {
          //   return new PolarPoint(point.x, point.y);
          // });

          // var minR, maxR;
          // var averageRadius = polarPoints.reduce(function (sum, point) {
          //   return sum + point.r;
          // }, 0) / polarPoints.length;
          // var deviations = polarPoints.sort(function(a, b) {return a.theta - b.theta}).map(function (point) {
          //   return Math.pow((point.r - averageRadius) / averageRadius, 2);
          // });
          // console.log(polarPoints);
          // console.log(deviations);
          // var paper = $scope.selectedShape.el.paper;
          // console.log(minR, maxR, maxR/minR);
          // paper.circle(cx, cy, averageRadius);
          // paper.text(cx, cy, (maxR/minR).toFixed(2))
          // var R = polarPoints.reduce(function (sum, point) {
          //   return sum += point.r;
          // }, 0) / polarPoints.length;
          // var a = polarPoints.reduce(function (sum, point) {
          //   return sum += point.r * Math.cos(point.theta);
          // }, 0) * 2 / polarPoints.length;
          // var b = polarPoints.reduce(function (sum, point) {
          //   return sum += point.r * Math.sin(point.theta);
          // }, 0) * 2 / polarPoints.length;

          // polarPoints.forEach(function (point) {
          //   if ((point.r - R) < 10) isCircle = false;
          // })
          // var avgDeviation = polarPoints.reduce(function (sum, point) {
            // console.log(R, a, b)
            // return sum += point.r - R;// - a * Math.cos(point.theta) - b * Math.sin(point.theta);
          // }, 0) / polarPoints.length;

          // console.log('Roundness: ', Math.abs(avgDeviation));
          // if (Math.abs(avgDeviation) < 25) return [cx, cy, R];
          return false;
        }

        if ($scope.tool.name === 'path') {
          var path = $scope.selectedShape.el.attr('path');
          var interval = 5;
          var newPath = path.reduce(function (newPathString, currentPoint, index, path) {
            if (!(index % interval) || index === (path.length - 1)) {
              return newPathString += currentPoint[1] + ',' + currentPoint[2] + ' ';
            } else {
              return newPathString;
            }
          }, path[0][0] + path[0][1] + ',' + path[0][2] + ' ' + "R");
          $scope.selectedShape.el.attr('path', newPath);
          
          var newCircle = roundness($scope.selectedShape.el.attr('path'));
          if (newCircle) {
            var paper = $scope.selectedShape.el.paper;
            // $scope.selectedShape.el.remove();
            paper.circle(newCircle[0], newCircle[1], newCircle[2]);
          }
        }
        Snap.createSnaps($scope.selectedShape.el);
        Broadcast.completeShape($scope.selectedShape.id);
        $scope.selectedShape = {};
      }
      //onkeypress listener is for text entry
      document.onkeypress = function(e) {
        var currentShape = $scope.selectedShape.el;
        if (currentShape && currentShape.type === 'text') {
          if (currentShape.attr('text') === 'Insert Text') {
            currentShape.attr('text', '');
          }
          if (e.keyCode === 8) {
            currentShape.attr('text', currentShape.attr('text').slice(0, currentShape.attr('text').length - 1));
          } else {
            currentShape.attr('text', currentShape.attr('text') + String.fromCharCode(e.keyCode));
          }
        }
      };
      //onkeydown listener is solely for backspace
      document.onkeydown = function(e) {
        if (e.which === 8) {
          e.preventDefault();
          var currentShape = $scope.selectedShape.el;
          if (currentShape && currentShape.type === 'text') {
            currentShape.attr('text', currentShape.attr('text').slice(0, currentShape.attr('text').length - 1));
          }
        }
      };

    },
    link: function (scope, element, attrs, ctrls) {
      scope.paper.sizeX = 1000;
      scope.paper.sizeY = 500;
      ShapeBuilder.raphael = Raphael(document.getElementById('board-container'), scope.paper.sizeX, scope.paper.sizeY);

      scope.paper.$canvas = element.find('svg');
      scope.paper.canvasX = scope.paper.$canvas.position().left;
      scope.paper.canvasY = scope.paper.$canvas.position().top;
      scope.paper.width = 400;
      scope.paper.height = 400;
      scope.paper.offsetX = 0;
      scope.paper.offsetY = 0;
      scope.paper.scalingFactor = 1;

      boardCtrl = ctrls[0];

      scope.paper.$canvas.bind('mousedown', function (ev) {
        boardCtrl.clEvent(ev);
        if (scope.selectedShape.el && scope.selectedShape.el.type === 'text') {
          boardCtrl.finishShape();
        } else {
          boardCtrl.createShape(ev);
        }
      });
      scope.paper.$canvas.bind('mousemove', function (ev) {
        boardCtrl.clEvent(ev);
        if (scope.selectedShape.el) {
          boardCtrl.editShape(ev);
        }
      });
      scope.paper.$canvas.bind('mouseup', function (ev) {
        boardCtrl.clEvent(ev);
        if (scope.selectedShape.el && scope.selectedShape.el.type !== 'text') {
          boardCtrl.finishShape();
        }
      });
      scope.paper.$canvas.bind('dblclick', function (ev) {
        boardCtrl.zoom(ev);
      });
    }
  };
}])
.directive('wbToolbar', function () {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'views/toolbar.html',
    require: ['^wbBoard'],
    scope: { 
      wbToolSelect: '@',
      wbZoomScale: '@',
      wbColorSelect: '@'
    },
    link: function (scope, element, attrs, ctrls) {
      var boardCtrl = ctrls[0];

      scope.wbZoomScaleDown = function () {
        scope.wbZoomScale -= 0.25;
      };

      scope.wbZoomScaleUp = function () {
        scope.wbZoomScale += 0.25;
      };

      scope.wbToolSelect = scope.wbToolSelect === undefined ? 'line' : scope.wbToolSelect;
      
      scope.$watch('wbToolSelect', function(newTool, prevTool) {
        boardCtrl.setToolName(newTool);
      }, false);
      
      scope.$watch('wbColorSelect', function(val) {
        boardCtrl.setColor(val);
      }, false);
      
      scope.wbZoomScale = scope.wbZoomScale === undefined ? 1 : scope.wbZoomScale;
      scope.$watch('wbZoomScale', function(newScale, prevScale) {
        if (newScale != 0 && !isNaN(newScale)) {
          boardCtrl.setZoomScale(newScale);
        }
      }, false);
    }
  };
});
