/* jsx */
require("./style.less");
import React from 'react'
import { render } from 'react-dom'
var _ = require('lodash');

import { Router, Route, Link, IndexRoute, browserHistory } from 'react-router'


var gval = (v,d) => (v === '' || v ? v : d);

var App = React.createClass({
    contextTypes: {
	router: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
	var q = this.props.location.query;

	var logop = q.logop || 'AND';
	var yes = q.yes || '';
	var not = q.not || '';
	var seat = q.seat || '';
	var top = q.top || '';
	
        return {frames:[],regex:'',logop,top,seat,yes,not};
    },
    componentWillUpdate: function(nps, ns) {
	console.log('will update, nps, ns')

	    if (!_.isEqual(this.props.location.query,nps.location.query)) {    
		var q = nps.location.query;

		var logop = gval(q.logop, ns.logop);
		var yes = gval(q.yes, ns.yes);
		var not = gval(q.not, ns.not);
		var seat = gval(q.seat, ns.seat);
		var top = gval(q.top, ns.top);
		
		this.setState({logop,top,seat,yes,not});
	    }
	
    },
    componentDidMount: function(){
        var that = this;
	fetch('/njs/frames.json').then(function(r){
	    r.json().then(function(x){
		x = x.sort((a,b)=>(parseInt(a.money.replace(/[$,]/gim,'')) - parseInt(b.money.replace(/[$,]/gim,''))));
		that.setState({frames:x})
	    })
	})
    },
    setval: function(name,val) {
	var that = this;
	var oldval = this.state[name];
	this.setState({[name]:val});

	var q = this.props.location.query;
	q[name] = val;
	that.context.router.push({pathname: '/njs/',query:q});
	
	try {
	    var x = new RegExp(val,'gim');
	    this.setState({[name + '-err']:null});
	}
	catch (err) {
	    this.setState({[name + '-err']:1});
	}

    },
    changeYes:function(e){
	this.setval('yes', e.target.value);
    },
    changeNot:function(e){
	this.setval('not', e.target.value);
    },
    changeSeat:function(e){
	this.setval('seat', e.target.value);
    },
    changeTop:function(e){
	this.setval('top', e.target.value);
    },
    clickFrame: function(f) {
	var that = this;
	return () => {
	    that.setState({selected:f});
	    console.log(f);
	}
    },
    unclickFrame: function(f) {
	var that = this;
	return () => {
	    that.setState({selected:null});
	    console.log(f);
	}
    },
    logop: function() {
	var that = this;
	var q = this.props.location.query;

	var logop = this.state.logop;
	
	if (logop === 'AND') {
	    this.setState({logop:'OR'});
	    q['logop'] = 'OR';
	}
	else {
	    this.setState({logop:'AND'});
	    q['logop'] = 'AND';
	}
	
	that.context.router.push({pathname: '/njs/',query:q});

    },
    render: function() {
	var that = this;
	var sframes = this.state.frames;
	var frames = sframes.map((f)=>{
	    try {
		var yes = !this.state['yes-err'];
		if (yes && this.state.yes) {
		    var yrgx = new RegExp(this.state.yes,'gim');
		    yes = ((f.text.match(yrgx) || f.title.match(yrgx)));
		}

		var not = !this.state['not-err'];
		if (not && this.state.not) {
		    var nrgx = new RegExp(this.state.not,'gim');
		    not = ((!f.text.match(nrgx) && !f.title.match(nrgx)));
		}

		var seat = !this.state['seat-err'];
		if (seat && this.state.seat) {
		    var srgx1 = new RegExp('seat tube.' + this.state.seat,'gim');
		    var srgx2 = new RegExp('seat.tube..C.T..' + this.state.seat,'gim');
		    seat = f.text.match(srgx1) || f.text.match(srgx2);
		}

		var top = !this.state['top-err'];
		if (top && this.state.top) {
		    var trgx1 = new RegExp('top tube.' + this.state.top,'gim');
		    var trgx2 = new RegExp('top tube.......' + this.state.top,'gim');
		    top = f.text.match(trgx1) || f.text.match(trgx2);
		}

		var yesnot = this.state.logop === 'OR' ? yes || not : yes && not; 

		if (yesnot && seat && top) {
		    if (f === that.state.selected) {
			return (
			    <div className="frame" key={f.url} onClick={that.unclickFrame(f)} >
			    <div className="content">
			    <img src={that.state.selected && that.state.selected.img} />
				</div>
				
				<a href={f.url} target="_blank">link</a>
			    <div className="money">{f.money}</div>
			    </div>
			)
		    }
		    else {
			return (
			    <div className="frame" key={f.url} onClick={that.clickFrame(f)}>
			    
			    <div className="content">
			    <div>{f.title}</div>
			    </div>

			    	<a href={f.url} target="_blank">link</a>
				<div className="money">{f.money}</div>
			    </div>
			);
		    }
		}
	    }
	    catch(xxx){
		console.log('aa')
	    }
	    return null;
	});
	
	return (
	    <div className="app">


	    <div className="filters">

	    <div className="filter">
	    <div>
	    contains
	    </div>
	    <input value={this.state.yes} onChange={this.changeYes} />
	    </div>

		<div className="logop" onClick={this.logop}>{this.state.logop}</div>
	    
	    <div className="filter">
	    <div>
	    does not contain
	    </div>
	    <input value={this.state.not} onChange={this.changeNot} />
	    </div>

	    <div className="filter">
	    <div>
	    seat tube
	    </div>
	    <input value={this.state.seat} onChange={this.changeSeat} />
	    </div>


	    <div className="filter">
	    <div>
	    top tube
	    </div>
	    <input value={this.state.top} onChange={this.changeTop} />
	    </div>

	    <div className="filter">

	    <div className="preset">
	    <a onClick={()=>(that.context.router.push({pathname: '/njs/',query:{logop:'OR', yes: 'no dent', not: 'dent',seat:'',top:''} }))} >No Dent</a>
	    </div>

	    <div className="preset">
	    <a onClick={()=>(that.context.router.push({pathname: '/njs/',query:{logop:'AND',seat:'',not:'',top:'', yes: 'aggressive'} }))} >Aggressive</a>
	    </div>

	    <div className="preset">
	    <a onClick={()=>(that.context.router.push({pathname: '/njs/',query:{logop:'AND',seat:'',not:'',top:'',yes: 'funny'} }))} >Funny</a>
	    </div>

	    <div className="preset">
	    <a onClick={()=>(that.context.router.push({pathname: '/njs/',query:{logop:'AND',yes:'',not:'',top:'', seat: '5[3-5]'} }))} >seat 53-55</a>
	    </div>

	    </div>
	    

	    
	    </div>

	    <input type="checkbox" id="nav-trigger" className="nav-trigger" />
	    <label htmlFor="nav-trigger">&nbsp;</label>
	    
	    <div className="frames">
	    <div className="list">
	    {frames}
	    </div>
	    </div>
	    </div>
	)
    }
});


import createBrowserHistory from 'history/lib/createBrowserHistory';

render((
    <Router history={browserHistory}>

    <Route path="/" component={App}>
    </Route>
    
    <Route path="/njs/" component={App}>
    </Route>
    
    <Route path="/njs" component={App}>
    </Route>
    
    </Router>), document.getElementById('content'));


