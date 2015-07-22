/* eslint no-console:0, no-unused-vars: 0, no-alert: 0 */
/* global React document $ console FormData alert window */
(function() {
    "use strict";

    var UploadBar = React.createClass({
        getInitialState: function() {
            return {ready: false};
        },
        onsubmit: function(e) {
            e.preventDefault();
            // upload file
            var formData = new FormData(e.target);
            var filename = $(e.target.file).val().split(/(\\|\/)/g).pop();
            $.ajax("/upload_experiment", {
                type: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function(ret) {
                    this.props.onsubmit(filename);
                    this.unready();
                }.bind(this)
            });
        },
        unready: function() {
            $(React.findDOMNode(this.refs.file)).val("");
            this.setState({ready: false});
        },
        onchange: function(e) {
            // check file has been selected
            var fpath = $(e.target).val();
            if (fpath.length === 0) {
                alert("no file selected for upload");
                this.unready();
                return;
            }
            // check file is the right extension
            var toks = fpath.split(".");
            var extension = toks[toks.length - 1];
            var allowedExtensions = ["txt", "csv", "xls"];
            if (allowedExtensions.indexOf(extension) < 0){
                alert("extension '" + extension + "' not allowed. Use " + allowedExtensions.join(", "));
                this.unready();
                return;
            }
            // enable upload
            this.setState({ready: true});
        },
        render: function() {
            var submitDisplay = this.state.ready ? "initial" : "none";
            return (
            <div className="uploadBar">
            <h3> Upload New Experiment </h3>
            <form action="/upload_experiment" onSubmit={this.onsubmit} method="post" encType="multipart/form-data">
            <input ref="file" type="file" name="file" onChange={this.onchange}/>
            <input type="submit" style={{display: submitDisplay}} value="Upload New Experiment"/>
            </form>
            </div>
            );
        }
    });

    var LaunchPanel = React.createClass({
        getInitialState: function() {
            return {userid: "unspecified_subject"};
        },
        changeUserid: function(e) {
            e.preventDefault();
            var newVal = $(e.target).val();
            this.setState({userid: newVal});
        },
        onsubmit: function(e) {
            e.preventDefault();
            var qs = $.param({
                filename: this.props.experimentName,
                userid: this.state.userid
            });
            window.location.href = "/experiment?" + qs;
        },
        downloadOriginal: function(e) {
            e.preventDefault();
            var qs = $.param({
                filename: this.props.experimentName});
            window.location.href = "/experiment_data/download?" + qs;
        },
        render: function() {
            return (
                <div className="launchPanel">
                <button type="button" onClick={this.downloadOriginal}>download original</button>
                <form onSubmit={this.onsubmit}>
                    UserId: <input onChange={this.changeUserid} type="text" name="userid" value={this.state.userid}/>
                    <input type="submit" value="Run Experiment"/>
                </form>
                </div>
            );
        }
    });

    var ExpNode = React.createClass({
        render: function() {
            var style = {background: (this.props.selected ? "#88f" : "#fff")};
            return (
                <div className="experimentNode" onClick={this.props.onClick} style={style}>
                    <span>{this.props.name}</span>
                </div>
            );
        }
    });

    var ExpList = React.createClass({
        getInitialState: function() {
            return {selected: null};
        },
        select: function(filename) {
            this.props.onChange();
        },
        render: function() {
            var experimentNodes = this.props.experiments.map(
                function(data) {
                    var selected = (data.name === this.props.selected);
                    var clickNode = function() {
                        this.props.onSelect(data.name, true);
                    }.bind(this);
                    return (
                        <li><ExpNode name={data.name} selected={selected} onClick={clickNode}/></li>
                    );
            }.bind(this));

            return (
                <div className="experimentList">
                <h3> Available Experiments </h3>
                <ul>
                {experimentNodes}
                </ul>
                </div>
            );
        }
    });

    var Preview = React.createClass({
        getInitialState: function() {
            return {rows: []};
        },
        refresh: function() {
            console.log(this.props.filename);
            $.ajax("/experiment_data/single", {
                data: {filename: this.props.filename},
                success: function(ret) {
                    var rows = ret.data;
                    var strRows = rows.map(JSON.stringify);
                    console.log(strRows);
                    this.setState({rows: strRows});
                }.bind(this)
            });
        },
        componentDidMount: function() {
            this.refresh();
        },
        componentDidUpdate: function(prevProps) {
            if (this.props.filename !== prevProps.filename) {
                this.refresh();
            }
        },
        render: function() {
            if (!this.props.filename) {
                return false;
            }

            var rows = this.state.rows.map(function(row) {
                return (
                    <li>{row}</li>
                );
            });
            return (
                <div className="preview">
                <h3> Preview </h3>
                <ul>
                {rows}
                </ul>
                </div>
            );
        }
    });

    var ExpApp = React.createClass({
        getInitialState: function() {
            return {experiments: [], selected: "", previewText: null};
        },
        componentDidMount: function() {
            this.reloadList();
        },
        reloadList: function() {
            $.ajax("/experiment_data/list", {
                success: (function(ret) {
                    this.setState({experiments: ret.experiments});
                }).bind(this)
            });
        },
        selectNode: function(filename, toggle) {
            if (toggle) {
                if (this.state.selected === filename) {
                    filename = "";
                }
            }
            this.setState({selected: filename});
        },
        onSubmitUploadBar: function(filename) {
            this.reloadList();
            this.selectNode(filename);
        },
        render: function() {
            var experimentSpecific = "";
            if (this.state.selected) {
                experimentSpecific = (
                    <div>
                    <LaunchPanel ref="launchpanel" experimentName={this.state.selected}/>
                    <Preview ref="previewPanel" filename={this.state.selected}/>
                    </div>
                );
            }
            return (
                <div className="experimentApp">
                <UploadBar onsubmit={this.onSubmitUploadBar}/>
                <ExpList experiments={this.state.experiments} selected={this.state.selected} onSelect={this.selectNode} ref="expList"/>
                {experimentSpecific}
                </div>
            );
        }
    });

    React.render(<ExpApp/>, document.getElementById("content"));
})();
