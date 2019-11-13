odoo.define('web_customize_modal.menu_switcher', function (require) {
"use strict";

// # Part of Odoo Module Developed by Kinfinity Tech Pvt. Ltd.
// # See LICENSE file for full copyright and licensing details.

var core = require('web.core');
var config = require('web.config');
//var weContext = require('web_editor.context');
var Widget = require('web.Widget');
var ajax = require('web.ajax');
var session = require('web.session');
var SystrayMenu = require('web.SystrayMenu');
var QWeb = core.qweb;

var Options = Widget.extend({
    name: 'web_customize_modal_menu',
    template: 'web_customize_modal.options_menu',
    events: {
        'change input[data-xmlid],input[data-enable],input[data-disable]': 'change_selection',
    },
    start: function () {
        var self = this;
        this.timer = null;
        this.reload = false;
        this.flag = false;
        this.active_select_tags();
        this.$inputs = this.$("input[data-xmlid],input[data-enable],input[data-disable]");
        setTimeout(function () {self.$el.addClass('in');}, 0);
        this.keydown_escape = function (event) {
            if (event.keyCode === 27) {
                self.close();
            }
        };
        $(document).on('keydown', this.keydown_escape);
        return this.load_xml_data().then(function () {
            self.flag = true;
        });
    },
    active_select_tags: function () {
        var uniqueID = 0;
        var self = this;
        var $selects = this.$('select:has(option[data-xmlid],option[data-enable],option[data-disable])');
        $selects.each(function () {
            uniqueID++;
            var $select = $(this);
            var $options = $select.find('option[data-xmlid], option[data-enable], option[data-disable]');
            $options.each(function () {
                var $option = $(this);
                var $input = $('<input style="display: none;" type="radio" name="color_customize_modal-select-'+uniqueID+'"/>');
                $input.attr('id', $option.attr('id'));
                $input.attr('data-xmlid', $option.data('xmlid'));
                $input.attr('data-enable', $option.data('enable'));
                $input.attr('data-disable', $option.data('disable'));
                $option.removeAttr('id');
                $option.data('input', $input);
                $input.on('update', function () {
                    $option.attr('selected', $(this).prop("checked"));
                });
                self.$el.append($input);
            });
            $select.data("value", $options.first());
            $options.first().attr("selected", true);
        });
        $selects.change(function () {
            var $option = $(this).find('option:selected');
            $(this).data("value").data("input").prop("checked", true).change();
            $(this).data("value", $option);
            $option.data("input").change();
        });
    },
    load_xml_data: function () {
        var self = this;
        $('#theme_error').remove();
        return ajax.jsonRpc('/web/web_customize_menu_get', 'call', {
            'xml_ids': this.get_xml_ids(this.$inputs)
        }).then(function (data) {
            self.$inputs.filter('[data-xmlid=""]').prop("checked", true).change();
            self.$inputs.filter('[data-xmlid]:not([data-xmlid=""])').each(function () {
                if (!_.difference(self.get_xml_ids($(this)), data[1]).length) {
                    $(this).prop("checked", false).trigger("change", true);
                }
                if (!_.difference(self.get_xml_ids($(this)), data[0]).length) {
                    $(this).prop("checked", true).trigger("change", true);
                }
            });
        }).guardedCatch(function (d, error) {
            $('body').prepend($('<div id="theme_error"/>').text(error.data.message));
        });
    },
    get_inputs: function (string) {
        return this.$inputs.filter('#'+string.split(/\s*,\s*/).join(", #"));
    },
    get_xml_ids: function ($inputs) {
        var xml_ids = [];
        $inputs.each(function () {
            if ($(this).data('xmlid') && $(this).data('xmlid').length) {
                xml_ids = xml_ids.concat($(this).data('xmlid').split(/\s*,\s*/));
            }
        });
        return xml_ids;
    },
    update_style: function (enable, disable, reload) {
        if (this.$el.hasClass("loading")) {
            return;
        }
        this.$el.addClass('loading');

        var self = this;
        return ajax.jsonRpc('/web/web_customize_menu', 'call', {
            enable: enable,
            disable: disable,
            get_bundle: true,
        }).then(function (bundleHTML) {
            var $links = $('link[href*=".assets_backend"]');
            var $newLinks = $(bundleHTML).filter('link');

            var linksLoaded = $.Deferred();
            var nbLoaded = 0;
            $newLinks.on('load', function (e) {
                if (++nbLoaded >= $newLinks.length) {
                    linksLoaded.resolve();
                }
            });
            $newLinks.on('error', function (e) {
                linksLoaded.reject();
                window.location.hash = "theme=true";
                window.location.reload();
            });

            $links.last().after($newLinks);
            return linksLoaded.then(function () {
                $links.remove();
                self.$el.removeClass('loading');
            });
        });
    },
    enable_disable: function ($inputs, enable) {
        $inputs.each(function () {
            var check = $(this).prop("checked");
            var $label = $(this).closest("label");
            $(this).prop("checked", enable);
            if (enable) $label.addClass("checked");
            else $label.removeClass("checked");
            if (check != enable) {
                $(this).change();
            }
        });
    },
    change_selection: function (event, init_mode) {
        var self = this;
        clearTimeout(this.time_select);

        if (this.$el.hasClass("loading")) return; // prevent to change selection when css is loading

        var $option = $(event.target).is('input') ? $(event.target) : $("input", event.target),
            $options = $option,
            checked = $option.prop("checked");
        if (checked) {
            if($option.data('enable')) {
                var $inputs = this.get_inputs($option.data('enable'));
                $options = $options.add($inputs.filter(':not(:checked)'));
                this.enable_disable($inputs, true);
            }
            if($option.data('disable')) {
                var $inputs = this.get_inputs($option.data('disable'));
                $options = $options.add($inputs.filter(':checked'));
                this.enable_disable($inputs, false);
            }
            $option.closest("label").addClass("checked");
        } else {
            $option.closest("label").removeClass("checked");
        }

        var $enable = this.$inputs.filter('[data-xmlid]:checked');
        $enable.closest("label").addClass("checked");
        var $disable = this.$inputs.filter('[data-xmlid]:not(:checked)');
        $disable.closest("label").removeClass("checked");

        var $sets = this.$inputs.filter('input[data-enable]:not([data-xmlid]), input[data-disable]:not([data-xmlid])');
        $sets.each(function () {
            var $set = $(this);
            var checked = true;
            if ($set.data("enable")) {
                self.get_inputs($(this).data("enable")).each(function () {
                    if (!$(this).prop("checked")) checked = false;
                });
            }
            if ($set.data("disable")) {
                self.get_inputs($(this).data("disable")).each(function () {
                    if ($(this).prop("checked")) checked = false;
                });
            }
            if (checked) {
                $set.prop("checked", true).closest("label").addClass("checked");
            } else {
                $set.prop("checked", false).closest("label").removeClass("checked");
            }
            $set.trigger('update');
        });

        if (this.flag && $option.data('reload') && document.location.href.match(new RegExp( $option.data('reload') ))) {
            this.reload = true;
        }

        clearTimeout(this.timer);
        if (this.flag) {
            this.timer = _.defer(function () {
                if (!init_mode) self.on_select($options, event);
                self.update_style(self.get_xml_ids($enable), self.get_xml_ids($disable), self.reload);
                self.reload = false;
                location.reload();
            });
        } else {
            this.timer = _.defer(function () {
                if (!init_mode) self.on_select($options, event);
                self.reload = false;
            });
        }
    },
    on_select: function ($inputs, event) {
        clearTimeout(this.time_select);
    },
    click: function (event) {
        if (!$(event.target).closest("#color_customize_modal > *").length) {
            this.close();
        }
    },
    close: function () {
        var self = this;
        $(document).off('keydown', this.keydown_escape);
        $('#theme_error').remove();
        $('link[href*=".assets_"]').removeAttr('data-loading');
        this.$el.removeClass('in');
        this.$el.addClass('out');
        setTimeout(function () {self.destroy();}, 500);
    }
});
if (session.is_system) {
    SystrayMenu.Items.push(Options);
}

return Options;

});
