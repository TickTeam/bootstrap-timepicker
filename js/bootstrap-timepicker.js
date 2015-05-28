/*
 * 2015-05-28 update by void, create mousewheel event
 */

/*!
 * Timepicker Component for Twitter Bootstrap
 *
 * Copyright 2013 Joris de Wit
 *
 * Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
(function($, window, document, undefined) {
  'use strict';

  // TIMEPICKER PUBLIC CLASS DEFINITION
  var Timepicker = function(element, options) {
    this.widget = '';
    this.$element = $(element);
    this.defaultTime = options.defaultTime;
    this.disableFocus = options.disableFocus;
    this.isOpen = options.isOpen;
    this.minuteStep = options.minuteStep;
    this.modalBackdrop = options.modalBackdrop;
    this.secondStep = options.secondStep;
    this.showInputs = options.showInputs;
    this.showMeridian = options.showMeridian;
    this.showSeconds = options.showSeconds;
    this.template = options.template;
    this.appendWidgetTo = options.appendWidgetTo;
    this.timeChanged = false;
    this.gmailMode = options.gmailMode;//@summer customize options, consider the different runtime environment
                                       //in gmail addon, this options will be setted true
    this.showTimeSelect = (typeof options.showTimeSelect == "undefined") ? true : options.showTimeSelect;//@simon customize options, to show select time

    this._init();
  };

  Timepicker.prototype = {

    constructor: Timepicker,

    _init: function() {
      var self = this;

      if (this.$element.parent().hasClass('bootstrap-timepicker') || this.$element.parent().hasClass('bootstrap-timepicker')) {
        this.$element.on({
          'click.timepicker': $.proxy(this.highlightUnitAndShowWidget, this),
          'focus.timepicker': $.proxy(this.highlightUnit, this),
          'keyup.timepicker': $.proxy(this.elementKeyup, this),
          'blur.timepicker': $.proxy(this.blurElement, this),
          'mousewheel.timepicker DOMMouseScroll.timepicker': $.proxy(this.mousewheel, this)
        });
      } else {
        if (this.template) {
          this.$element.on({
            'focus.timepicker': $.proxy(this.showWidget, this),
            'click.timepicker': $.proxy(this.showWidget, this),
            'blur.timepicker': $.proxy(this.blurElement, this),
            'mousewheel.timepicker DOMMouseScroll.timepicker': $.proxy(this.mousewheel, this)
          });
        } else {
          this.$element.on({
            'focus.timepicker': $.proxy(this.highlightUnit, this),
            'click.timepicker': $.proxy(this.highlightUnit, this),
            'keyup.timepicker': $.proxy(this.elementKeyup, this),
            'blur.timepicker': $.proxy(this.blurElement, this),
            'mousewheel.timepicker DOMMouseScroll.timepicker': $.proxy(this.mousewheel, this)
          });
        }
      }

      if (this.template !== false) {
        this.$widget = $(this.getTemplate()).prependTo(this.$element.parents(this.appendWidgetTo)).on('click', $.proxy(this.widgetClick, this));
      } else {
        this.$widget = false;
      }

      if (this.showInputs && this.$widget !== false) {
        this.$widget.find('input').each(function() {
          $(this).on({
            'click.timepicker': function() { $(this).select(); },
            'keydown.timepicker': $.proxy(self.widgetKeydown, self),
            'keyup.timepicker': $.proxy(self.widgetKeyup, self)
          });
        });
        this.$widget.find('.timepicker-quick-selector a').each(function() {
          $(this).on({
            'click.timepicker': $.proxy(self.widgetTimeQuickSelect, self)
          });
        });
      }

      this.setDefaultTime(this.defaultTime);
    },

    // mousewheel event
    mousewheel: function (e) {
      if(e.disableMousewheel) return;
      e.preventDefault();
      e.stopPropagation();

      // firefox detail 向下滚3,其他 wheelDeta向下 -120
      var detail = e.wheelDelta || -e.detail

      switch (this.highlightedUnit) {
      case 'hour':
        detail ? this.incrementHour() : this.decrementHour();
        this.highlightHour();
        break;
      case 'minute':
        detail ? this.incrementMinute() : this.decrementMinute();
        this.highlightMinute();
        break;
      case 'second':
        detail ? this.incrementSecond() : this.decrementSecond();
        this.highlightSecond();
        break;
      case 'meridian':
        this.toggleMeridian();
        this.highlightMeridian();
        break;
      }

    },

    blurElement: function() {
      this.highlightedUnit = undefined;
      this.updateFromElementVal();
    },

    decrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 1) {
          this.hour = 12;
        } else if (this.hour === 12) {
          this.hour--;

          return this.toggleMeridian();
        } else if (this.hour === 0) {
          this.hour = 11;

          return this.toggleMeridian();
        } else {
          this.hour--;
        }
      } else {
        if (this.hour === 0) {
          this.hour = 23;
        } else {
          this.hour--;
        }
      }
      this.update();
    },

    decrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute - step;
      } else {
        newVal = this.minute - this.minuteStep;
      }

      if (newVal < 0) {
        this.decrementHour();
        this.minute = newVal + 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    decrementSecond: function() {
      var newVal = this.second - this.secondStep;

      if (newVal < 0) {
        this.decrementMinute(true);
        this.second = newVal + 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    elementKeyup: function(e) {
      e = e || window.event;
      switch (e.keyCode) {
      case 9: //tab
        this.updateFromElementVal();

        switch (this.highlightedUnit) {
        case 'hour':
          e.preventDefault();
          this.highlightNextUnit();
          break;
        case 'minute':
          if (this.showMeridian || this.showSeconds) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        case 'second':
          if (this.showMeridian) {
            e.preventDefault();
            this.highlightNextUnit();
          }
          break;
        case 'meridian':
          e.preventDefault();
          this.highlightWidget();

          break;
        }
        break;
      case 27: // escape
        this.updateFromElementVal();
        break;
      case 37: // left arrow
        e.preventDefault();
        this.highlightPrevUnit();
        this.updateFromElementVal();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.incrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.incrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.incrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      case 39: // right arrow
        e.preventDefault();
        this.updateFromElementVal();
        this.highlightNextUnit();
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (this.highlightedUnit) {
        case 'hour':
          this.decrementHour();
          this.highlightHour();
          break;
        case 'minute':
          this.decrementMinute();
          this.highlightMinute();
          break;
        case 'second':
          this.decrementSecond();
          this.highlightSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          this.highlightMeridian();
          break;
        }
        break;
      case 13:
        this.hideWidget();
        this.$element.blur();
        break;
      default:
        if(this.getCursorPosition() == 2 || this.getCursorPosition() == 5) {
          this.highlightNextUnit();
          this.updateFromElementVal();
        }
        break;
      }
    },

    formatTime: function(hour, minute, second, meridian) {
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;
      //@summer format time to 24hour when !showMeridian
      var time = hour + ':' + minute + (this.showSeconds ? ':' + second : '') + ' ' + meridian;
      if(!this.showMeridian) {
        time = moment(time, 'HH:mm').lang('en').format('HH:mm');
      }
      return time;
    },

    getCursorPosition: function() {
      var input = this.$element.get(0);

      if ('selectionStart' in input) {// Standard-compliant browsers

        return input.selectionStart;
      } else if (document.selection) {// IE fix
        input.focus();
        var sel = document.selection.createRange(),
          selLen = document.selection.createRange().text.length;

        sel.moveStart('character', - input.value.length);

        return sel.text.length - selLen;
      }
    },

    getTemplate: function() {
      var template,
        hourTemplate,
        minuteTemplate,
        secondTemplate,
        meridianTemplate,
        templateContent;

      if (this.showInputs) {
        hourTemplate = '<input type="text" name="hour" class="bootstrap-timepicker-hour" maxlength="2"/>';
        minuteTemplate = '<input type="text" name="minute" class="bootstrap-timepicker-minute" maxlength="2"/>';
        secondTemplate = '<input type="text" name="second" class="bootstrap-timepicker-second" maxlength="2"/>';
        meridianTemplate = '<input type="text" name="meridian" class="bootstrap-timepicker-meridian" maxlength="2"/>';
      } else {
        hourTemplate = '<span class="bootstrap-timepicker-hour"></span>';
        minuteTemplate = '<span class="bootstrap-timepicker-minute"></span>';
        secondTemplate = '<span class="bootstrap-timepicker-second"></span>';
        meridianTemplate = '<span class="bootstrap-timepicker-meridian"></span>';
      }
      //@summer add timepicker-quick-selector list, remove table widget
      templateContent = '<ul class="timepicker-quick-selector">'+
          (this.showMeridian ?
            '<li><a href="#">09:00 AM</a></li>'+
            '<li><a href="#">12:00 PM</a></li>'+
            '<li><a href="#">03:00 PM</a></li>'+
            '<li><a href="#">08:00 PM</a></li>'
          : '<li><a href="#">09:00</a></li>'+
            '<li><a href="#">12:00</a></li>'+
            '<li><a href="#">15:00</a></li>'+
            '<li><a href="#">20:00</a></li>'
          ) +
        '</ul>';
       //  '<table>'+
       //   '<tr>'+
       //     '<td><a href="#" data-action="incrementHour"><i class="icon_home icon_chevron_up"></i></a></td>'+
       //     '<td class="separator">&nbsp;</td>'+
       //     '<td><a href="#" data-action="incrementMinute"><i class="icon_home icon_chevron_up"></i></a></td>'+
       //     (this.showSeconds ?
       //       '<td class="separator">&nbsp;</td>'+
       //       '<td><a href="#" data-action="incrementSecond"><i class="icon_home icon_chevron_up"></i></a></td>'
       //     : '') +
       //     (this.showMeridian ?
       //       '<td class="meridian-column"><a href="#" data-action="toggleMeridian"><i class="icon_home icon_chevron_up"></i></a></td>'
       //     : '') +
       //   '</tr>'+
       //   '<tr>'+
       //     '<td>'+ hourTemplate +'</td> '+
       //     '<td class="separator">:</td>'+
       //     '<td>'+ minuteTemplate +'</td> '+
       //     (this.showSeconds ?
       //      '<td class="separator">:</td>'+
       //      '<td>'+ secondTemplate +'</td>'
       //     : '') +
       //     (this.showMeridian ?
       //      '<td>'+ meridianTemplate +'</td>'
       //     : '') +
       //   '</tr>'+
       //   '<tr>'+
       //     '<td><a href="#" data-action="decrementHour"><i class="icon_home icon_chevron_down"></i></a></td>'+
       //     '<td class="separator"></td>'+
       //     '<td><a href="#" data-action="decrementMinute"><i class="icon_home icon_chevron_down"></i></a></td>'+
       //     (this.showSeconds ?
       //      '<td class="separator">&nbsp;</td>'+
       //      '<td><a href="#" data-action="decrementSecond"><i class="icon_home icon_chevron_down"></i></a></td>'
       //     : '') +
       //     (this.showMeridian ?
       //      '<td><a href="#" data-action="toggleMeridian"><i class="icon_home icon_chevron_down"></i></a></td>'
       //     : '') +
       //   '</tr>'+
       // '</table>';

      switch(this.template) {
      case 'modal':
        template = '<div class="bootstrap-timepicker-widget modal hide fade in" data-backdrop="'+ (this.modalBackdrop ? 'true' : 'false') +'">'+
          '<div class="modal-header">'+
            '<a href="#" class="close" data-dismiss="modal">×</a>'+
            '<h3>Pick a Time</h3>'+
          '</div>';
          if (this.showTimeSelect) {
            template = template + '<div class="modal-content">'+
              templateContent +
            '</div>';
          }
          template = template + '<div class="modal-footer">'+
            '<a href="#" class="btn btn-primary" data-dismiss="modal">OK</a>'+
          '</div>'+
        '</div>';
        break;
      case 'dropdown':
        if (this.showTimeSelect) {
          template = '<div class="bootstrap-timepicker-widget dropdown-menu">'+ templateContent +'</div>';
        }
        break;
      }

      return template;
    },

    getTime: function() {
      return this.formatTime(this.hour, this.minute, this.second, this.meridian);
    },

    hideWidget: function() {
      if (this.isOpen === false) {
        return;
      }

      if (this.showInputs) {
        //@summer 20130710. now the table widget is removed, here can only execute this.updateFromElementVal()

        //in the table widget, the meridian has the default value, only set time when hour or minute has value
        if($('.bootstrap-timepicker-hour').val() || $('.bootstrap-timepicker-minute').val()) {
          //set time of input which the cursor focus on
          //@summer can not be in common use, waiting for optimizing
          if($('input.reminder').is(':focus')) {
            this.updateFromElementVal();
          } else {
            this.updateFromWidgetInputs();
          }
        }
      }

      this.$element.trigger({
        'type': 'hide.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('hide');
      } else {
        this.$widget.removeClass('open');
      }

      if(this.gmailMode) {
        //@summer setReminderTime in gmail addon
        this.setReminderTime();
      } else {
        //@summer trigger setReminderTime function in detail view
        Backbone.trigger('setReminderTime');
      }

      $(document).off('mousedown.timepicker');

      this.isOpen = false;
      this.timeChanged = false;
    },

    /*********used in gmail addon start**********/
    setReminderTime: function() {
      if($('#tk-timepicker').val()) {
        $('#tk-menu .reminder .remove').addClass('on');
        this.__tryToSetDefaultDueDateAsToday();
      }
    },

    __tryToSetDefaultDueDateAsToday: function() {
      if ($('#tk-menu input.date').val() == '') {
        $('#tk-menu .date').val(moment().format("YYYY-MM-DD"));
        $('#tk-menu .dueDate .remove').addClass('on');
      }
    },
    /*********used in gmail addon end**********/

    highlightUnit: function() {
      this.position = this.getCursorPosition();
      if (this.position >= 0 && this.position <= 2) {
        this.highlightHour();
      } else if (this.position >= 3 && this.position <= 5) {
        this.highlightMinute();
      } else if (this.position >= 6 && this.position <= 8) {
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMeridian();
        }
      } else if (this.position >= 9 && this.position <= 11) {
        this.highlightMeridian();
      }
    },

    highlightUnitAndShowWidget: function() {
      this.highlightUnit();
      this.showWidget();
    },

    highlightWidget: function() {
      $('.timepicker-quick-selector li').first().focus();
    },

    highlightWidgetNextEle: function(current) {
      current.next('li').addClass('active');
    },

    highlightNextUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMinute();
        break;
      case 'minute':
        if (this.showSeconds) {
          this.highlightSecond();
        } else if (this.showMeridian){
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'second':
        if (this.showMeridian) {
          this.highlightMeridian();
        } else {
          this.highlightHour();
        }
        break;
      case 'meridian':
        this.highlightHour();
        break;
      }
    },

    highlightWidgetNextUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightWidgetMinute();
        break;
      case 'minute':
        if (this.showSeconds) {
          this.highlightWidgetSecond();
        } else if (this.showMeridian){
          this.highlightWidgetMeridian();
        } else {
          this.highlightWidgetHour();
        }
        break;
      case 'second':
        if (this.showMeridian) {
          this.highlightWidgetMeridian();
        } else {
          this.highlightWidgetHour();
        }
        break;
      case 'meridian':
        this.highlightWidgetHour();
        break;
      }
    },

    highlightPrevUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightMeridian();
        break;
      case 'minute':
        this.highlightHour();
        break;
      case 'second':
        this.highlightMinute();
        break;
      case 'meridian':
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMinute();
        }
        break;
      }
    },

    highlightWidgetPrevUnit: function() {
      switch (this.highlightedUnit) {
      case 'hour':
        this.highlightWidgetMeridian();
        break;
      case 'minute':
        this.highlightWidgetHour();
        break;
      case 'second':
        this.highlightWidgetMinute();
        break;
      case 'meridian':
        if (this.showSeconds) {
          this.highlightWidgetSecond();
        } else {
          this.highlightWidgetMinute();
        }
        break;
      }
    },

    highlightHour: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'hour';

      if ($element.setSelectionRange) {
        setTimeout(function() {
          $element.setSelectionRange(0,2);
        }, 0);
      }
    },

    highlightWidgetHour: function() {
      var $input = $('input.bootstrap-timepicker-hour');

      this.highlightedUnit = 'hour';

      $input.select();
    },

    highlightMinute: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'minute';

      if ($element.setSelectionRange) {
        setTimeout(function() {
          $element.setSelectionRange(3,5);
        }, 0);
      }
    },

    highlightWidgetMinute: function() {
      var $input = $('input.bootstrap-timepicker-minute');

      this.highlightedUnit = 'minute';

      $input.select();
    },

    highlightSecond: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'second';

      if ($element.setSelectionRange) {
        setTimeout(function() {
          $element.setSelectionRange(6,8);
        }, 0);
      }
    },

    highlightWidgetSecond: function() {
      var $input = $('input.bootstrap-timepicker-second');

      this.highlightedUnit = 'second';

      $input.select();
    },

    highlightMeridian: function() {
      var $element = this.$element.get(0);

      this.highlightedUnit = 'meridian';

      if ($element.setSelectionRange) {
        if (this.showSeconds) {
          setTimeout(function() {
            $element.setSelectionRange(9,11);
          }, 0);
        } else {
          setTimeout(function() {
            $element.setSelectionRange(6,8);
          }, 0);
        }
      }
    },

    highlightWidgetMeridian: function() {
      var $input = $('input.bootstrap-timepicker-meridian');

      this.highlightedUnit = 'meridian';

      $input.select();
    },

    incrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 11) {
          this.hour++;
          return this.toggleMeridian();
        } else if (this.hour === 12) {
          this.hour = 0;
        }
      }
      if (this.hour === 23) {
        this.hour = 0;

        return;
      }
      this.hour++;
      this.update();
    },

    incrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute + step;
      } else {
        newVal = this.minute + this.minuteStep - (this.minute % this.minuteStep);
      }

      if (newVal > 59) {
        this.incrementHour();
        this.minute = newVal - 60;
      } else {
        this.minute = newVal;
      }
      this.update();
    },

    incrementSecond: function() {
      var newVal = this.second + this.secondStep - (this.second % this.secondStep);

      if (newVal > 59) {
        this.incrementMinute(true);
        this.second = newVal - 60;
      } else {
        this.second = newVal;
      }
      this.update();
    },

    remove: function() {
      $('document').off('.timepicker');
      if (this.$widget) {
        this.$widget.remove();
      }
      delete this.$element.data().timepicker;
    },

    setDefaultTime: function(defaultTime){
      if (!this.$element.val()) {
        if (defaultTime === 'current') {
          var dTime = new Date(),
            hours = dTime.getHours(),
            minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
            seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
            meridian = 'AM';

          //@summer if !showMeridian also need excute the following
          // if (this.showMeridian) {
            if (hours === 0) {
              hours = 12;
            } else if (hours >= 12) {
              if (hours > 12) {
                hours = hours - 12;
              }
              meridian = 'PM';
            } else {
              meridian = 'AM';
            }
          // }

          this.hour = hours;
          this.minute = minutes;
          this.second = seconds;
          this.meridian = meridian;

          this.update();

        } else if (defaultTime === false) {
          this.hour = 0;
          this.minute = 0;
          this.second = 0;
          this.meridian = 'AM';
        } else {
          this.setTime(defaultTime);
        }
      } else {
        this.updateFromElementVal();
      }
    },

    setTime: function(time) {
      var arr,
        timeArray;

      if (this.showMeridian) {
        arr = time.split(' ');
        timeArray = arr[0].split(':');
        this.meridian = arr[1];
      } else {
        timeArray = time.split(':');
        //@summer set meridian when !showMeridian
        //if meridian not set, formatTime function will goes wrong
        if(time.split(' ')[1]) {
          this.meridian = moment(time, 'hh:mm A').lang('en').format('A');
        } else {
          this.meridian = moment(time, 'HH:mm').lang('en').format('A');
        }
      }

      this.hour = parseInt(timeArray[0], 10);
      this.minute = parseInt(timeArray[1], 10);
      this.second = parseInt(timeArray[2], 10);

      if (isNaN(this.hour)) {
        this.hour = 0;
      }
      if (isNaN(this.minute)) {
        this.minute = 0;
      }

      if (this.showMeridian) {
        if (this.hour > 12) {
          //@summer Modulo hour when it's exceeded
          //set meridian to PM
          this.hour = this.hour % 12;
          this.meridian = 'PM';
        } else if (this.hour < 1) {
          this.hour = 12;
        }

        if (this.meridian === 'am' || this.meridian === 'a') {
          this.meridian = 'AM';
        } else if (this.meridian === 'pm' || this.meridian === 'p') {
          this.meridian = 'PM';
        }

        if (this.meridian !== 'AM' && this.meridian !== 'PM') {
          this.meridian = 'AM';
        }
      } else {
        if (this.hour >= 24) {
          //@summer Modulo hour when it's exceeded
          //set meridian to PM
          this.hour = this.hour % 24;
          this.meridian = 'PM';
        } else if (this.hour < 0) {
          this.hour = 0;
          this.meridian = 'AM';
        }
      }

      if (this.minute < 0) {
        this.minute = 0;
      } else if (this.minute >= 60) {
        this.minute = 59;
      }

      if (this.showSeconds) {
        if (isNaN(this.second)) {
          this.second = 0;
        } else if (this.second < 0) {
          this.second = 0;
        } else if (this.second >= 60) {
          this.second = 59;
        }
      }

      this.update();
    },

    showWidget: function() {
      if (this.isOpen) {
        return;
      }

      if (this.$element.is(':disabled')) {
        return;
      }

      var self = this;
      $(document).on('mousedown.timepicker', function (e) {
        e = e || window.event;
        //@summer Clicked outside the timepicker, hide it
        //.closest('#time-setting') can not be in common use , waiting for optimizing
        if ($(e.target).closest('.bootstrap-timepicker').length === 0) {
          self.hideWidget();
        }
      });

      this.$element.trigger({
        'type': 'show.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.disableFocus) {
        this.$element.blur();
      }

      if ($('input.reminder').val()) {
        this.updateFromElementVal();
      } else {
        this.updateWidgetMeridian();
      }

      if (this.template === 'modal' && this.$widget.modal) {
        this.$widget.modal('show').on('hidden', $.proxy(this.hideWidget, this));
      } else {
        if (this.isOpen === false) {
          this.$widget.addClass('open');
        }
      }

      if($('#calendar-container').is(':visible')) {
        $('#calendar-container').hide();
      }

      this.isOpen = true;
      this.highlightWidgetHour();
    },

    toggleMeridian: function() {
      this.meridian = this.meridian === 'AM' ? 'PM' : 'AM';
      this.update();
    },

    update: function() {
      this.$element.trigger({
        'type': 'changeTime.timepicker',
        'time': {
          'value': this.getTime(),
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      this.updateElement();
      this.updateWidget();
    },

    updateElement: function() {
      this.$element.val(this.getTime()).change();
    },

    updateFromElementVal: function() {
      var val = this.$element.val();

      if (val) {
        this.setTime(val);
      }
    },

    updateWidget: function() {
      if (this.$widget === false) {
        return;
      }

      var hour = this.hour < 10 ? '0' + this.hour : this.hour,
          minute = this.minute < 10 ? '0' + this.minute : this.minute,
          second = this.second < 10 ? '0' + this.second : this.second;

      if (this.showInputs) {
        this.$widget.find('input.bootstrap-timepicker-hour').val(hour);
        this.$widget.find('input.bootstrap-timepicker-minute').val(minute);

        if (this.showSeconds) {
          this.$widget.find('input.bootstrap-timepicker-second').val(second);
        }
        if (this.showMeridian) {
          this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
        }
      } else {
        this.$widget.find('span.bootstrap-timepicker-hour').text(hour);
        this.$widget.find('span.bootstrap-timepicker-minute').text(minute);

        if (this.showSeconds) {
          this.$widget.find('span.bootstrap-timepicker-second').text(second);
        }
        if (this.showMeridian) {
          this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
        }
      }
    },

    updateWidgetMeridian: function() {
      var dTime = new Date(),
        hours = dTime.getHours(),
        minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
        seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
        meridian = 'AM';

      if (this.showMeridian) {
        if (hours === 0) {
          hours = 12;
        } else if (hours >= 12) {
          if (hours > 12) {
            hours = hours - 12;
          }
          meridian = 'PM';
        } else {
          meridian = 'AM';
        }
      }

      this.meridian = meridian;

      if (this.showInputs) {
        if (this.showMeridian) {
          this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
        }
      } else {
        if (this.showMeridian) {
          this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
        }
      }
    },

    updateFromWidgetInputs: function() {
      if (this.$widget === false) {
        return;
      }
      var time = $('input.bootstrap-timepicker-hour', this.$widget).val() + ':' +
        $('input.bootstrap-timepicker-minute', this.$widget).val() +
        (this.showSeconds ? ':' + $('input.bootstrap-timepicker-second', this.$widget).val() : '') +
        (this.showMeridian ? ' ' + $('input.bootstrap-timepicker-meridian', this.$widget).val() : '');

      if(time != ': ') {
        this.setTime(time);
      }
    },

    widgetClick: function(e) {
      e = e || window.event;
      e.stopPropagation();
      e.preventDefault();

      var action = $(e.target).closest('a').data('action');
      if (action) {
        this[action]();
      }
    },

    setMeridian: function(meridian) {
      if(meridian) {
        this.meridian = meridian;
      }
    },

    //@simon customize for modify meridian dynamicly
    setShowMeridian: function(showMeridian) {
      if (typeof showMeridian != "undefined") {
        this.showMeridian = showMeridian;
      }
    },

    setMinute: function(minute) {
      if(minute) {
        this.minute = parseInt(minute, 10);
        if (isNaN(this.minute)) {
          this.minute = 0;
        }
      }
    },

    setHour: function(hour) {
      if(hour) {
        this.hour = parseInt(hour, 10);
        if (isNaN(this.hour)) {
          this.hour = 0;
        }
      }
    },

    widgetKeydown: function(e) {
      e = e || window.event;
      var $input = $(e.target).closest('input'),
          name = $input.attr('name');

      switch (e.keyCode) {
      case 9: //tab
        if (this.showMeridian) {
          if (name === 'meridian') {
            this.highlightedUnit = 'meridian';
            this.setMeridian($('.bootstrap-timepicker-meridian').val());
            return this.hideWidget();
          } else if (name === 'minute') {
            this.highlightedUnit = 'minute';
            this.setMinute($('.bootstrap-timepicker-minute').val());
            return this.highlightWidgetNextUnit();
          } else if (name === 'hour') {
            this.highlightedUnit = 'hour';
            this.setHour($('.bootstrap-timepicker-hour').val());
            return this.highlightWidgetNextUnit();
          }
        } else {
          if (this.showSeconds) {
            if (name === 'second') {
              return this.hideWidget();
            }
          } else {
            if (name === 'minute') {
              return this.hideWidget();
            }
          }
        }

        this.updateFromWidgetInputs();
        break;
      case 27: // escape
        this.hideWidget();
        break;
      case 37: // left arrow
        e.preventDefault();
        if (name === 'meridian') {
          this.highlightedUnit = 'meridian';
        } else if (name === 'minute') {
          this.highlightedUnit = 'minute';
        } else if (name === 'hour') {
          this.highlightedUnit = 'hour';
        }
        this.highlightWidgetPrevUnit();
        break;
      case 38: // up arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.incrementHour();
          break;
        case 'minute':
          this.incrementMinute();
          break;
        case 'second':
          this.incrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      case 39: // right arrow
        e.preventDefault();
        if (name === 'meridian') {
          this.highlightedUnit = 'meridian';
        } else if (name === 'minute') {
          this.highlightedUnit = 'minute';
        } else if (name === 'hour') {
          this.highlightedUnit = 'hour';
        }
        return this.highlightWidgetNextUnit();
        break;
      case 40: // down arrow
        e.preventDefault();
        switch (name) {
        case 'hour':
          this.decrementHour();
          break;
        case 'minute':
          this.decrementMinute();
          break;
        case 'second':
          this.decrementSecond();
          break;
        case 'meridian':
          this.toggleMeridian();
          break;
        }
        break;
      case 13:
        this.hideWidget();
        break;
      }
    },

    widgetKeyup: function(e) {
      e = e || window.event;
      var $input = $(e.target).closest('input'),
          name = $input.attr('name');

      switch (e.keyCode) {
      case 9:
        e.preventDefault();
        this.highlightWidgetNextEle();
        break;
      default:
        if (this.showMeridian) {
          if (name === 'meridian') {
            this.setMeridian($('.bootstrap-timepicker-meridian').val());
          } else if (name === 'minute') {
            this.setMinute($('.bootstrap-timepicker-minute').val());
          } else if (name === 'hour') {
            this.setHour($('.bootstrap-timepicker-hour').val());
          }
        }
        break;
      }
    },

    //@summer time quick select
    widgetTimeQuickSelect: function(e) {
      e = e || window.event;
      if (this.$widget === false) {
        return;
      }
      var time = $(e.target).text();
      this.setTime(time);
      this.hideWidget();
    }
  };


  //TIMEPICKER PLUGIN DEFINITION
  $.fn.timepicker = function(option) {
    var args = Array.apply(null, arguments);
    args.shift();
    return this.each(function() {
      var $this = $(this),
        data = $this.data('timepicker'),
        options = typeof option === 'object' && option;

      if (!data) {
        $this.data('timepicker', (data = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options, $(this).data()))));
      }

      if (typeof option === 'string') {
        data[option].apply(data, args);
      }
    });
  };

  $.fn.timepicker.defaults = {
    defaultTime: 'current',
    disableFocus: false,
    isOpen: false,
    minuteStep: 15,
    modalBackdrop: false,
    secondStep: 15,
    showSeconds: false,
    showInputs: true,
    showMeridian: true,
    gmailMode: false,
    template: 'dropdown',
    appendWidgetTo: '.bootstrap-timepicker',
    disableMousewheel: false,
  };

  $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);
