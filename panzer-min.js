/* Panzer v0.1.1 + genData v1.2.0 / Bemi Faison (c) 2012 / MIT / http://github.com/bemson */
;(typeof exports!="undefined"?exports:window).genData=function(a){var b=arguments,c=b.callee,d,e,f,g,h=[],i=[],j,k={},l,m,n,o=c,p=typeof o=="function",q;if(this instanceof c){if(a){~{}.toString.call(b[1]).indexOf("y")&&(o=a,b=b[1]),h=h.concat([].slice.call(b));function s(a,b,d){var e=~{}.toString.call(b).indexOf("y");return this instanceof s?a?new c(e?a:s,h.concat(e?b:[].slice.call(arguments))):this:c(a,h.concat(b||[]),d?d:s)}return s.prototype=p?new o:o,s}return this}b[1]&&(h=typeof b[1]=="function"?[b[1]]:b[1]),f=h.length,b[2]&&(o=b[2]);function r(a,b){this.name=a,this.value=b}r.prototype=p?o.prototype:o,l=[["",a]];while(l.length){n=l.shift(),q=new r(n[0],n[1]),e=0,d={parent:0,omit:0,scan:1,exit:0},b=[q.name,q.value,n[2],i,d,k];while(e<f&&!d.exit)h[e++].apply(q,b);d.omit?q._OMIT=!0:i.push(q);if(d.exit)l=[];else{m=[];if(d.scan&&typeof q.value=="object"){j=typeof d.parent=="object"?d.parent:q;for(g in q.value)q.value.hasOwnProperty(g)&&m.push([g,q.value[g],j])}l=m.concat(l)}}return i};
!function(inCommonJsEnv,Array,Object,RegExp,window,undefined){function Tree(panzer,panzerInst,rawtree,pkgConfig){var tree=this;tree.panzer=PZR=panzer,tree.y=[{},function(a,b){return a===panzer?b?(tree.pkgs[panzer.i[b]]||{}).inst||!1:tree:toStringResult}],panzer.d.forEach(function(a){var b=a.def.attributeKey,c=a.def.invalidKey;a.c={af:typeof b=="function"?b:0,ar:b&&b instanceof RegExp?b:0,nf:typeof c=="function"?c:0,nr:c&&c instanceof RegExp?c:0}}),tree.nodes=genNodes(rawtree),PZR=0,tree.nodes[0].parentIndex=tree.nodes[0].childIndex=0,tree.nodes.unshift(genNodes()[0]);with(tree.nodes[0])children.push(1),name="_tree",index=0,depth=0,path="..//",ctx=1;tree.nodes[0].firstChildIndex=tree.nodes[0].lastChildIndex=1,tree.tank={id:panzer.c++,currentIndex:0,targetIndex:-1,go:function(a){var b=tree.nodes[a];return b&&(tree.target=b,tree.tank.targetIndex=b.index),tree.stop=0,tree.go()},stop:function(){return tree.stop=1,!!tree.loop},post:function(a){switch(typeof a){case"function":return tree.posts.push(a)-1;case"number":if(tree.posts[a])return tree.posts[a]=0,!0}return!1}},tree.posts=[],tree.current=tree.nodes[0],tree.target=tree.loop=0,tree.pkgs=panzer.d.map(function(a){function c(){}var b={name:a.name,inst:new a.def};return c.prototype=a.proxy.prototype,tree.y[0][a.name]=b.proxy=new c,b.inst.nodes=genCloneNodes(tree.nodes,0,a.node),b.inst.tank=tree.tank,typeof a.def.init=="function"&&a.def.init.call(b.inst,pkgConfig),b}),tree.pkgs.forEach(function(a,b,c){a.proxy.pkgs=tree.y[0],a.proxy.toString=tree.y[1],a.inst.proxy=panzerInst}),panzerInst.pkgs=tree.y[0],panzerInst.toString=tree.y[1],this.ret=1}function PanzerResolvePackage(a){var b=this;if(arguments.length){if(typeof a=="string"&&/\w/.test(a)){if(!b.i.hasOwnProperty(a)){var c=b.d.length;function d(c){if(!(this instanceof arguments.callee))return c instanceof b.P&&c.toString(b,a)}d.init=d.attributeKey=d.invalidKey=d.onBegin=d.onEnd=d.onTraverse=0;function e(){}e.prototype=new b.Y,b.P.prototype=d.proxy=e.prototype,b.Y=e;function f(){}d.node=f.prototype,b.i[a]=b.d.push({name:a,def:d,proxy:e,node:f})-1}return b.d[b.i[a]].def}return!1}return b.d.map(function(a){return a.name})}if(!inCommonJsEnv&&window.Panzer)return;var environment=inCommonJsEnv?exports:window,genData=(inCommonJsEnv?require("genData"):window).genData,PZR,toStringResult={}.toString(),testNodeKey=function(a,b,c){var d=a+"f",e=a+"r";return PZR.d.some(function(a){if(a.c[d])return a.c[d].call(window,b,c);if(a.c[e])return a.c[e].test(b)})},genNodes=new genData(function(a,b,c,d,e,f){var g=this,h=c&&testNodeKey("n",a,b),i=c&&!h&&testNodeKey("a",a,b);h||i?(e.omit=1,e.scan=0,i&&!h&&(c.attributes[a]=b)):(g.ctx=g.parentIndex=g.previousIndex=g.nextIndex=g.firstChildIndex=g.lastChildIndex=g.childIndex=undefined,g.index=d.length+1,g.depth=c?c.depth+1:1,g.name=c?a:"_root",g.attributes={},g.path=c?c.path+a+"/":"//",g.children=[],c&&(g.parentIndex=c.index,c.children.length||(c.firstChildIndex=g.index),g.childIndex=c.children.push(g.index)-1,c.lastChildIndex=g.index,g.childIndex&&(g.previousIndex=c.children[g.childIndex-1],d[g.previousIndex-1].nextIndex=g.index)))}),genCloneNodes=new genData(function(a,b,c,d,e){if(!c)e.omit=1;else{e.scan=0;for(var f in b)b.hasOwnProperty(f)&&f!=="ctx"&&(this[f]=b[f])}}),arrayPrototype=Array.prototype;arrayPrototype.some||(arrayPrototype.some=function(a,b){for(var c=0,d=this.length;c<d;c++)if(a.call(b,this[c],c,this))return!0;return!1}),arrayPrototype.forEach||(arrayPrototype.forEach=function(a,b){for(var c=0,d=this.length;c<d;c++)a.call(b,this[c],c,this)}),arrayPrototype.map||(arrayPrototype.map=function(a,b){var c=0,d=this.length,e=new Array(d);for(;c<d;c++)e[c]=a.call(b,this[c],c,this);return e}),Tree.prototype={go:function(){var a=this,b=a.nodes,c=a.tank,d,e=0,f=a.current,g=0,h=0,i;if(a.loop)return!!a.target;a.posts=[],a.loop=1,a.fire("Begin");while(a.loop)a.target&&!a.stop?(i=0,d=a.target.index-f.index,d?d>0&&f.index<2||!a.target.path.indexOf(f.path)?f.ctx?(g=0,h=f.firstChildIndex):(g=1,h=1,f.ctx=1):f.ctx?(g=1,h=2,f.ctx=0):(a.target.path.indexOf(b[f.parentIndex].path)&&(d=-1),h=d<0?4:3,f.lastEvent===2||f.lastEvent===h||f.lastEvent+h===7?(g=0,h=d>0?f.nextIndex:f.previousIndex||f.parentIndex):g=1):(g=1,h=f.ctx?0:1,f.ctx&&(a.target=0,c.targetIndex=-1),f.ctx=1),g?(f.lastEvent=h,e++,a.fire("Traverse",[h])):(f.lastEvent=0,f=a.current=b[h],c.currentIndex=h)):!i&&(a.stop||!a.target)?(i=1,a.fire("End")):a.loop=0;return a.posts.forEach(function(a){typeof a=="function"&&a()}),e},fire:function(a,b){var c=this.panzer;if(!this.ret)return;b=b||[],b.unshift(a.toLowerCase()),this.pkgs.forEach(function(d){var e=c.d[c.i[d.name]].def["on"+a];typeof e=="function"&&e.apply(d.inst,b)})}},environment.Panzer={version:"0.1",create:function(){function b(b,c){if(this instanceof arguments.callee)new Tree(a,this,b,typeof c=="object"?c:{});else throw new Error("Missing new operator.")}var a={c:0,d:[],i:{},Y:function(){},P:b};return b.pkg=function(b){return PanzerResolvePackage.apply(a,arguments)},b}}}(typeof require!="undefined",Array,Object,RegExp,this);