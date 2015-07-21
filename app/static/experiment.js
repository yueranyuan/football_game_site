/* eslint no-unused-vars: 0 */
/* global React $ moment setTimeout document*/
(function() {
    "use strict";

    function getTime() {
        return moment().format("YYYY-MM-DD HH:mm:ss.SSS");
    }

    var globals = {};

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
                callback(_this.props.children.join(""));
            }, this.props.timeout);
        },
        render: function() {
            return (
                <div className="page">
                {this.props.children}
                </div>
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
                <div className="inputPanel">
                {this.props.message}
                <form action="">
                {this.props.prompt}: <input type="text" name="textfield" ref="textfield"></input>
                <input type="submit" value="Go" onClick={this.clickCallback}></input>
                </form>
                </div>
            );
        }
    });


    var Debrief = React.createClass({
        start: function(callback) {
        },
        render: function() {
            return (
                <Page> experiment finished </Page>
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
            this.allPages = [
                {mode: "input", message: "Enter User Information", prompt: "userid", setter: setUserid},
                {mode: "page", time: 10 * 1000, content: "Rest for 10 seconds"},
                {mode: "page", time: 60 * 1000, content: "Repeatedly subtract 9 from 1000. 1000, 991, 982, 973...."},
                {mode: "page", time: 60 * 1000, content: "Relax and think about nothing"},
                {mode: "page", time: 60 * 1000, content: "Repeatedly subtract 8 from 1000. 1000, 992, 984, 976...."},
                {mode: "page", time: 60 * 1000, content: "Relax and think about nothing"}];
            this.allPages = [
                {mode: "input", message: "Enter User Information", prompt: "userid", setter: setUserid},
                {mode: "page", time: 1000, content: "a"},
                {mode: "page", time: 1000, content: "b"}
            ];
            this.next();
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
                return <Page ref={"page"} timeout={this.state.time}> {this.state.content} </Page>;
            } else if (mode === "input") {
                return <InputPanel ref={"page"} setter={this.state.setter} prompt={this.state.prompt} message={this.state.message}/>;
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
