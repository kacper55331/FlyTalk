/**
 * Created by kacpe on 17.07.2016.
 */

(function ($) {
    "use strict";

    var Fly = new function () {
        this.debug = true;
        this.title = document.title;

        this.popup = false;

        this.updateTimeTimer = null;

        this.log = function (message) {
            if (this.debug)
                console.log("DBG: " + message);
        };

        this.initialize = new function () {
            this.onReady = function () {
                history.replaceState({title: Fly.title}, document.location);

                Fly.updateTime();
                Fly.updateTimeTimer = setInterval(Fly.updateTime, 1000);
                Fly.log("onReady");
            };

            this.onLoad = function () {
                Fly.log("onLoad");
            };

            this.onResize = function () {
                Fly.log("onResize");
            };

            this.onFocus = function () {
                Fly.log("onFocus");
            };

            this.onBlur = function () {
                Fly.log("onBlur");
            };

            this.onPopState = function (event) {
                Fly.popup = true;
                new Fly.Redirect(document.location, {
                    title: event.state.title ? Fly.title : fly["board_name"]
                });
                //redirect(event.state.title ? Fly.title : fly["board_name"], document.location, false, null);
            };
        };

        this.updateTime = function () {
            $("body").find("time").each(function () {
                var time = parseInt($(this).attr("data-unix"));
                $(this).html(Fly.Tools.timeAgo(time));
            });
        };

        this.Request = function (url, def_options) {
            this.options = {
                method: 'post',
                data: {},
                onSuccess: Function,
                beforeSend: Function,
                onAlways: Function
            };
            $.extend(this.options, def_options || {});

            this.request = function (url) {
                Fly.log("Request FROM: " + url);
                var c_options = this.options;
                $.ajax({
                    type: c_options.method,
                    url: url + "&ajax=" + fly["session_id"],
                    data: c_options.data,
                    beforeSend: function () {
                        var $loading = $("#loading");
                        if ($loading.length == 0) {
                            $("body").append("<div id='loading'><img src='" + fly['loading_img'] + "' alt='' /></div>");
                        }

                        c_options.beforeSend.call(c_options.beforeSend);
                    },
                    success: function (data) {

                        c_options.onSuccess.call(c_options.onSuccess, data);
                    }
                }).always(function () {
                    $("#loading").delay(100).fadeOut(400, function () {
                        $(this).remove();
                    });

                    c_options.onAlways.call(c_options.onAlways);
                });
            };
            this.request(url);
        };

        this.Redirect = function (url, def_options) {
            this.options = {
                method: 'post',
                title: '',
                object: null,
                inside: false,
                data: {},
                onSuccess: Function,
                beforeSend: Function,
                onAlways: Function,
                beforeFadeOut: Function,
                afterFadeOut: Function,
                afterFadeIn: Function
            };
            $.extend(this.options, def_options || {});
            this.request = function (url) {
                var c_options = this.options;
                var $inside = !c_options.inside ? $("#main_page") : $("#main_page_inside");

                var temp_url = "";
                if (c_options.object != null) {
                    if (c_options.object.attr("ref") == "index")
                        temp_url = fly["board_url"] + "/";

                    if (c_options.object.attr("rel") == "popup")
                        return false;
                }
                else {
                    if (url == fly["board_url"] + "/" || url == fly["board_url"] + "/index.php")
                        url = fly["board_url"] + "/index.php?ref=back";
                }

                if (typeof($.colorbox) != "undefined")
                    $.colorbox.close();

                $.ajax({
                    type: c_options.method,
                    url: url + "&ajax=" + fly["session_id"],
                    data: c_options.data,
                    beforeSend: function () {
                        var $loadingBar = $("#loadingbar");
                        if ($loadingBar.length === 0) {
                            $("body").append("<div id='loadingbar'></div>");
                            $loadingBar.addClass("waiting").append($("<dt/><dd/>"));
                            $loadingBar.width((50 + Math.random() * 30) + "%");
                        }

                        c_options.beforeSend.call(c_options.beforeSend);
                    },
                    success: function (data) {
                        var json = $.parseJSON(data);

                        var temp_title = "";
                        if (c_options.object != null) {
                            if (c_options.title && c_options.title != fly["board_name"])
                                temp_title = c_options.title + " - " + fly["board_name"];
                            else if (json.title && json.title != fly["board_name"])
                                temp_title = json.title + " - " + fly["board_name"];
                            else
                                temp_title = fly["board_name"];

                            history.pushState({
                                title: temp_title,
                                inside: c_options.inside
                            }, temp_title, temp_url ? temp_url : url);
                        }
                        else temp_title = c_options.title;

                        if (Fly.popup) {
                            temp_title = json.title + " - " + fly["board_name"];
                        }

                        Fly.title = document.title = temp_title;

                        c_options.beforeFadeOut.call(c_options.beforeFadeOut);

                        $inside.fadeOut(200, function () {
                            $inside.html(json.output);
                            c_options.afterFadeOut.call(c_options.afterFadeOut);
                            $inside.fadeIn(200, function () {
                                $("body").stop().animate({scrollTop: 0}, 1);
                                c_options.afterFadeIn.call(c_options.afterFadeIn);
                            });
                        });

                        if (!Fly.popup) {
                            c_options.onSuccess.call(c_options.onSuccess, data);
                        }
                        Fly.popup = false;
                    }
                }).always(function () {
                    $("#loadingbar").width("101%").delay(200).fadeOut(400, function () {
                        $(this).remove();
                    });

                    c_options.onAlways.call(c_options.onAlways);
                });
            };
            this.request(url);
        };

        this.Tools = new function () {
            this.normalRedirect = function (url) {
                var ua = navigator.userAgent.toLowerCase(),
                    isIE = ua.indexOf('msie') !== -1,
                    version = parseInt(ua.substr(4, 2), 10);

                if (isIE && version < 9) {
                    var link = document.createElement('a');
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                }
                else
                    window.location.replace(url);
            };
            this.toHtmlEncoded = function (string) {
                return string.replace(/[\u0080-\uC350]/g, function (a) {
                    return '&#' + a.charCodeAt(0) + ';';
                });
            };
            this.isString = function (object) {
                return Object.prototype.toString.call(object) === '[object String]';
            };
            this.isArray = function (object) {
                return Object.prototype.toString.call(object) === '[object Array]';
            };
            this.stringify = function (object) {
                return JSON.stringify(object);
            };
            this.dli = function (x, a, b, c) {
                if (x == 1) return a;
                if (x % 10 > 1 && x % 10 < 5 && !(x % 100 >= 10 && x % 100 <= 21)) return b;
                return c;
            };
            this.timeAgo = function (time) {
                var actDate = Date.now() / 1000 | 0;
                var prDate = new Date(time * 1000);
                var output = "";
                var dry = actDate - prDate.getTime() / 1000;
                if (dry < 86400) {
                    var date = new Date(Math.abs(dry)).getTime();
                    if (date > (60 * 60)) {
                        output = Math.round(date / 60 / 60) + " " + Fly.Tools.dli(Math.round(date / 60 / 60), fly['lang_time']['hours'][0], fly['lang_time']['hours'][1], fly['lang_time']['hours'][2]) + " " + fly['lang_time']['ago'][0];
                    }
                    else if (date > 60) {
                        output = Math.round(date / 60) + " " + Fly.Tools.dli(Math.round(date / 60), fly['lang_time']['minutes'][0], fly['lang_time']['minutes'][1], fly['lang_time']['minutes'][2]) + " " + fly['lang_time']['ago'][0];
                    }
                    else if (date > 5) {
                        output = Math.round(date) + " " + Fly.Tools.dli(Math.round(date), fly['lang_time']['seconds'][0], fly['lang_time']['seconds'][1], fly['lang_time']['seconds'][2]) + " " + fly['lang_time']['ago'][0];
                    }
                    else if (date <= 5) {
                        output = fly['lang_time']['moment'][0];
                    }
                }
                else if (dry > 86400 && dry < 2 * 86400) {
                    output = fly['lang_time']['yesterday'][0] + ", " + prDate.format(fly['lang_time']['yesterday'][1]);
                } else {
                    output = prDate.format(fly['lang_time']['date_format'][0]);
                }
                return output;
            }
        };

        this.Cookie = new function () {
            this.set = function (cname, cvalue, exdays) {
                var d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toUTCString();
                $(document).cookie = cname + "=" + cvalue + "; " + expires;
            };

            this.get = function (cname) {
                var name = cname + "=";
                var ca = $(document).cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1);
                    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
                }
                return false;
            };

            this.delete = function (cname) {
                Fly.Cookie.set(cname, "", -3600);
            };
        };
    };

    $(document).ready(Fly.initialize.onReady());
    $(window).load(Fly.initialize.onLoad());
    $(window).focus(Fly.initialize.onFocus());
    $(window).blur(Fly.initialize.onBlur());
    $(window).on('resize', Fly.initialize.onResize());
    window.onpopstate = Fly.initialize.onPopState;

    $(document).delegate("a", "click", function (event) {
        var $this = $(this);
        var temp_title = $this.attr("title");
        if ($this.attr("fix-title"))
            temp_title = $this.attr("fix-title");
        if ($this.attr("original-title"))
            temp_title = $this.attr("original-title");

        Fly.Redirect($this.attr("href"), {
            title: temp_title,
            object: $this,
            data: $this.attr("data"),
            onSuccess: function (data) {

            }
        });

        new Fly.Request(fly['board_url'] + "/index.php?app=core&module=ajax_test", {
            onSuccess: function (data) {
                console.log(data);
            }
        });

        event.preventDefault();
    });
})(jQuery);


