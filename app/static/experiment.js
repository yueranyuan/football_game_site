/* eslint no-unused-vars: 0 */
/* global React $ moment setTimeout document window SERVER_GLOBALS */
(function() {
    "use strict";

    function getTime() {
        return moment().format("YYYY-MM-DD HH:mm:ss.SSS");
    }

    var globals = {
        userid: SERVER_GLOBALS.userid || "unspecified_user"
    };

    var Logger = function(endpoint, name) {
        this.name = name || "task_" + getTime() + ".txt";
        this.buffer = "start_time\tend_time\tsubject\tblock\tstim\n";
        this.log = function(toks) {
            var line = toks.join("\t") + "\n";
            this.buffer += line;
        };

        this.flush = function() {
            $.ajax(endpoint, {
                method: "POST",
                data: {name: this.name,
                       data: this.buffer}
                });
            this.buffer = "";
        };
    };

    var logger = new Logger("/api/update");

    var Page = React.createClass({
        start: function(callback) {
            if (!this.props.timeout) {
                return;
            }
            var _this = this;
            setTimeout(function() {
                callback(_this.props.children);
            }, this.props.timeout);
        },
        render: function() {
            return (
                <div className="page">{this.props.children}</div>
            );
        }
    });

    var InputPanel = React.createClass({
        start: function(callback) {
            this.callback = callback;
        },
        clickCallback: function(e) {
            e.preventDefault();
            var val = React.findDOMNode(this.refs.textfield).value.trim();
            this.props.setter(val);
            this.callback(this.props.prompt);
        },
        render: function() {
            return (
                <div className="inputPanel page">
                {this.props.message}
                <form action="">
                {this.props.prompt}: <input type="text" name="textfield" ref="textfield"></input>
                <input type="submit" value="Go" onClick={this.clickCallback}></input>
                </form>
                </div>
            );
        }
    });

    var MovingText = React.createClass({
        start: function(callback) {
            var _this = this;
            setTimeout(function() {
                var stim = _this.props.x + "_" + _this.props.y + "_" + _this.props.children;
                callback(stim);
            }, this.props.timeout);
        },
        render: function() {
            var x = this.props.x * $(window).width();
            var y = this.props.y * $(window).height();
            return (
                <div className="movingText" style={{position: "absolute", left: x + "px", top: y + "px"}}>
                {this.props.children}
                </div>
            );
        }
    });

    var Debrief = React.createClass({
        start: function(callback) {
        },
        render: function() {
            return (
                <Page>experiment finished</Page>
            );
        }
    });

    var PageContainer = React.createClass({
        getInitialState: function() {
            return {mode: "start"};
        },
        componentDidMount: function() {
            var setUserid = function(val) {
                globals.userid = val;
            };

            // user info
            var setup = [{mode: "input", message: "Enter User Information", prompt: "userid", setter: setUserid}];

            // fixation stims
            var fixationCount = 5;
            var fixations = [];
            for (var i = 0; i < fixationCount; i++) {
                fixations[i] = {mode: "movingText", time: 2000, x: Math.random(), y: Math.random(), stim: "+"};
            }

            // eeg stims
            var eegStims = [
                {mode: "page", time: 10 * 1000, stim: "Rest for 10 seconds"},
                {mode: "page", time: 60 * 1000, stim: "Repeatedly subtract 9 from 1000. 1000, 991, 982, 973...."},
                {mode: "page", time: 60 * 1000, stim: "Relax and think about nothing"},
                {mode: "page", time: 60 * 1000, stim: "Repeatedly subtract 8 from 1000. 1000, 992, 984, 976...."},
                {mode: "page", time: 60 * 1000, stim: "Relax and think about nothing"}
            ];

            this.allPages = setup.concat(fixations, eegStims);
            $.ajax("/experiment_data/single", {
                data: {filename: SERVER_GLOBALS.filename},
                success: function(ret) {
                    this.allPages = ret.data;
                    this.next();
                }.bind(this)
            });
        },
        next: function() {
            if (this.allPages.length === 0) {
                this.setState({mode: "finish"});
                return;
            }
            var pageObj = this.allPages.shift();
            var _this = this;
            this.setState(pageObj, function() {
                var startTime = getTime();
                var callback = function(stim) {
                    var endTime = getTime();
                    logger.log([startTime, endTime, globals.userid, _this.state.mode, stim]);
                    logger.flush();
                    _this.next();
                };
                this.refs.page.start(callback);
            });
        },
        makePage: function(mode) {
            if (mode === "page") {
                return <Page ref={"page"} timeout={this.state.time}>{this.state.stim}</Page>;
            } else if (mode === "input") {
                return <InputPanel ref={"page"} setter={this.state.setter} prompt={this.state.stim} message={this.state.message}/>;
            } else if (mode === "movingText") {
                return <MovingText ref={"page"} x={this.state.x} y={this.state.y} timeout={this.state.time}>{this.state.stim}</MovingText>;
            } else if (mode === "finish") {
                return <Debrief/>;
            }
            return "";
        },
        render: function() {
            var page = this.makePage(this.state.mode);
            return (
                <div className="pageContainer">
                    {page}
                </div>
            );
        }
    });

    var container = <PageContainer />;

    React.render(container,
        document.getElementById("content")
    );
})();
