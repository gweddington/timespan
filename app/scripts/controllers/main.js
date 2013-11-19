'use strict';

angular.module('spanApp')
  .controller('MainCtrl', function ($scope, $http) {

  	var LOCAL_CACHE_KEY = 'tasks';

	function round(num) {
		return Math.round(num * 1000) / 1000; //round to 3 places
	}

  	function Task(name) {
  		var scope = $scope.$new();
  		var self = this;
  		var interval;
  		var clone;

  		self.startTime = function () {
  			return self.timeIn.format('hh:mm A');
  		};
  		self.isOpen = function () {
  			var answer = self.timeOut ? false : true;
  			return answer;
  		};
  		self.stop = function () {
  			self.timeOut = moment();
  			calcHours("stop");
  			self.prevHours = self.hours;
  			window.clearInterval(interval);
  		};
  		self.start = function () {
  			self.timeIn = moment();
  			self.timeOut = undefined;
  			self.prevHours = self.hours;
	  		startInterval();
  		};

  		function diff(end) {
  			return end.diff(self.timeIn, 'hours', true);
  		}
  		function startInterval() {
			interval = window.setInterval(calcHours, 2500);
			//go ahead and do it now once instead of waiting for the interval to kick in
			calcHours();
  		}
  		function calcHours(stop) {
  			self.hours = round(self.prevHours + diff(stop ? self.timeOut : moment()));
  			//initially this is called before the parent object is completely defined, i guess
  			//if you can, tell the parent that the tasks array has changed
  			//merely watching for the array to change was not enough and passing the third parameter
  			// to tell $watch to listen for object equality caused a bunch of errors
  			if (scope.$parent.tasksChanged) {
  				scope.$parent.tasksChanged();
  			}
  			if(!$scope.$$phase) {
  				$scope.$apply();
			}
	  	}

  		if (typeof name === "object") {
  			//this is a task-like object to clone
  			clone = name;
  			self.name = clone.name || "none";
  			self.hours = clone.hours || 0.0;
  			self.timeIn = moment(clone.timeIn);
  			self.timeOut = clone.timeOut ? moment(clone.timeOut) : undefined;
  			self.prevHours = clone.prevHours || 0.0;
  			if (self.isOpen()) {
  				startInterval();
  			}
  		} else {
	  		self.name = name || "none";
	  		self.hours = 0.0;
	  		self.start();
  		}
  	}

  	function getLocal() {
  		var tasksString = localStorage.getItem(LOCAL_CACHE_KEY);
  		var tasks;
  		if (tasksString) {
  			tasks = JSON.parse(tasksString);

  			tasks = tasks.map(function(task) {
  				return new Task(task);
  			});
  		}

  		return tasks;
  	}

  	function setLocal() {
  		localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify($scope.tasks));
  	}

  	$scope.tasks = getLocal() || [];
  	$scope.taskName = undefined;

	$scope.addTask = function() {
		var newTask = new Task($scope.taskName); 
		$scope.tasks.push(newTask);
		$scope.taskName = undefined; 
	}

	$scope.removeTask = function(task) { 
		$scope.tasks.splice($scope.tasks.indexOf(task), 1); 
		$scope.tasksChanged();
	}

	$scope.tasksChanged = function () {
		setLocal();
	}

	$scope.clearTasks = function () {
		$scope.tasks = [];
		$scope.tasksChanged();
	}

	$scope.totalHours = function() { 
		if ($scope.tasks.length === 1) {
			return $scope.tasks[0].hours;
		}
		return $scope.tasks.length ? round($scope.tasks.reduce(function(prev, curr) { 
			if (typeof prev === "object")
				prev = prev.hours;
			return prev + curr.hours;
		})) : 0; 
	}

	$scope.addOnEnter = function($event) {
		if ($event.which === 13) {
			$scope.addTask();
			$scope.$apply();
		}
	}
	//for some unknown reason, ng-keydown is not firing the event handler. So this is my attempt at making it work while still using the angular directive.
	$("input[ng-keydown*='$event'").on('keydown', function($event) {
		$scope.addOnEnter($event);
	});


	//watch for changes to occur to the tasks array
	$scope.$watch('tasks', $scope.tasksChanged);

	window.debug = $scope;
	$scope.doSomething = function($event) {
		var className = Math.random() > 0.5 ? "btn-error3d" : "btn-success3d";
		var target = $($event.currentTarget).addClass(className);
		window.setTimeout(function () { 
			target.removeClass(className);
		}, 3000);
	}
  });