/* global React $ moment */

function getTime() {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
}

var globals = {};

var Logger = function(endpoint, name) {
    this.name = name || "task_" + getTime() + ".txt";
    this.buffer = "start_time\tend_time\tsubject\tblock\tstim\n";
    this.log = function(toks) {
        var line = toks.join('\t') + '\n';
        this.buffer += line;
    };

    this.flush = function() {
        $.ajax(endpoint, {
            method: 'POST',
            data: {name: this.name,
                   data: this.buffer}
            });
        this.buffer = '';
    };
};

var logger = new Logger('/api/update');

var Page = React.createClass({
    render: function() {
        return (
            <div className="page">
            {this.props.children}
            </div>
        );
    }
});

var Debrief = React.createClass({
    render: function() {
        return (
            <Page> experiment finished </Page>
        );
    }
});

var SimpleController = function(name, component, callback, timeout) {
    this.name = name;
    this.active = false;
    this.start = function(state) {
        if (this.active) {
            return;
        }
        this.active = true;
        this.start_time = getTime();
        if (timeout && callback) {
            var _this = this;
            setTimeout(function() {
                _this.stop();
                callback();
            }, timeout);
        }
    };
    this.stop = function() {
        var end_time = getTime();
        logger.log([this.start_time, end_time, globals['userid'], this.name, this.name]);
        logger.flush();
        this.active = false;
    };
    this.render = function() {
        return component;
    };
};

var InputPanel = React.createClass({
    clickCallback: function(e) {
        e.preventDefault();
        var val = React.findDOMNode(this.refs.textfield).value.trim();
        this.props.setter(val);
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

var InputController = function() {
    this.name = "input";
    this.active = false;
    this.start = function(state, callback) {
        if (this.active) {
            return;
        }
        this.start_time = getTime();
        this.active = true;
        this.prompt = state.prompt;
        this.message = state.message;
        var _this = this;
        this.setter = function(val) {
            state.setter(val);
            _this.stop();
            callback();
        }
    };
    this.stop = function() {
        var end_time = getTime();
        logger.log([this.start_time, end_time, globals['userid'], this.name, this.prompt]);
        logger.flush();
        this.active = false;
    };
    this.render = function() {
        return <InputPanel prompt={this.prompt} message={this.message} setter={this.setter}> </ InputPanel>;
    };
};

var PageController = function() {
    this.name = "page";
    this.active = false;
    this.start = function(state, callback) {
        if (this.active) {
            return;
        }
        this.start_time = getTime();
        this.active = true;
        this.content = state.content;
        var _this = this;
        setTimeout(function() {
            _this.stop();
            callback();
        }, state.time);
    };
    this.stop = function() {
        var end_time = getTime();
        logger.log([this.start_time, end_time, globals['userid'], this.name, this.content]);
        logger.flush();
        this.active = false;
    };
    this.render = function() {
        return <Page> {this.content} </ Page>;
    };
};

var PageContainer = React.createClass({
    getInitialState: function() {
        this.controllers = {"page": new PageController(),
                  "finish": new SimpleController("finish", <Debrief/>),
                  "input": new InputController()};
        return {mode: "start"};
    },
    componentDidMount: function() {
        var setUserid = function(val) {
            globals['userid'] = val;
        };
        this.allPages = [
            {mode: "input", message: "Enter User Information", prompt: "userid", setter: setUserid},
            {mode: "page", time: 10 * 1000, content: "Rest for 10 seconds"},
            {mode: "page", time: 60 * 1000, content: "Repeatedly subtract 9 from 1000. 1000, 991, 982, 973...."},
            {mode: "page", time: 60 * 1000, content: "Relax and think about nothing"},
            {mode: "page", time: 60 * 1000, content: "Repeatedly subtract 8 from 1000. 1000, 992, 984, 976...."},
            {mode: "page", time: 60 * 1000, content: "Relax and think about nothing"}];
        this.next();
    },
    next: function() {
        if (this.allPages.length === 0) {
            this.setState({mode: "finish"});
            return;
        }
        var pageObj = this.allPages.shift();
        this.setState(pageObj);
    },
    getController: function(name) {
        var controller = this.controllers[name];
        if (controller) {
            controller.start(this.state, this.next);
        }
        return controller;
    },
    render: function() {
        var page = "";
        this.controller = this.getController(this.state.mode);
        if (this.controller) {
            page = this.controller.render();
        }
        return (
            <div className="pageContainer">
                {page}
            </div>
        );
    }
});

var container = <PageContainer />;

React.render(container,
    document.getElementById('content')
);
