/* Panzer v0.3.10 + genData v3.1.0 | github.com/bemson | (c) 2012, MIT */
;!function(a,b,c){function f(a){return"function"==typeof a}function g(a){return"function"!=typeof a}function h(a){function w(a,b){this.name=a,this.value=b}if(this instanceof h)return this;var e,i,l,m,o,p,q,r,s,t,b=[["",a]],j=d.call(arguments),k=j.slice(1),n=k.filter(f),u=[],v=n.length;if(!v)return[];for(w.prototype=("function"==typeof this?this:h).prototype,l={returns:u,args:k.filter(g),params:j,loop:0,queued:0};b.length;){for(i=b.shift(),q=new w(i[0],i[1]),r=t=0,p=[i[0],i[1],i[2],l],l.continues=0,l.breaks=0,l.source=i[1];!l.continues&&v>r;)l.allowUndefined=0,o=n[r++].apply(q,p),(o!==c||l.allowUndefined)&&(m=o,t=1);if(t&&u.push(m),l.breaks)break;if("object"==typeof l.source){e=[];for(s in l.source)l.source.hasOwnProperty(s)&&e.push([s,l.source[s],q]);b=e.concat(b)}l.loop++,l.queued=b.length-1}return l.hasOwnProperty("returns")?l.returns:u}var d=a.prototype.slice;a.isArray||function(b){return b instanceof a},h.spawn=function i(){function c(e){return this instanceof c?this:a.apply("function"==typeof this?this:c,[e].concat(b,d.call(arguments).slice(1)))}var a=this,b=d.call(arguments).filter(f);return c.prototype=new a,c.spawn=i,c},h.version="3.1.0",b.genData=h}(Array,this);
!function(c,g,e,b,a,d,h){function f(k){var r={create:function(){var v={pkgs:[],pkgsIdx:{},KlassProxy:function(){},Klass:w};function w(y,x){if(!(this instanceof w)){throw new Error("Missing new operator.")}new m(v,this,y,typeof x==="object"?x:{})}w.prototype=v.KlassProxy.prototype;w.pkg=function(){return u.apply(v,arguments)};return w},version:"0.3.10"},s=(g||c)?k("genData"):d.genData,n=0,l=0,i=({}).toString(),o=s.spawn(function(x,H,I,A){var B=this,E=A.args[0],C=A.args[1],y=A.returns,w=C&&x&&(C.nf.some(z)||C.nr.some(F)),G=C&&x&&(C.af.some(z)||C.ar.some(F)),J,D,v=0;function z(K){return K.call(d,x,H)}function F(K){return K.test(x)}if(w||G){A.source=0;if(G){I.attrs[x]=H}}else{B.parentIndex=B.previousIndex=B.nextIndex=B.firstChildIndex=B.lastChildIndex=B.childIndex=B.ctx=B.lte=-1;B.index=y.push(B);B.depth=I?I.depth+1:1;B.name=x||"PROOT";B.attrs={};B.path=I?I.path+x+"/":"//";B.children=[];if(I){B.parentIndex=I.index;if(!I.children.length){I.firstChildIndex=B.index}B.childIndex=I.children.push(B.index)-1;I.lastChildIndex=B.index;if(B.childIndex){B.previousIndex=I.children[B.childIndex-1];y[B.previousIndex-1].nextIndex=B.index}}else{A.tree=H}if(I&&E&&E.pkgs.length){for(;D=E.pkgs[v];v++){if(typeof D.def.prepNode==="function"&&typeof(J=D.def.prepNode.call(d,A.source,A.tree))!=="undefined"){A.source=J}}}}}),t=s.spawn(function(w,z,x,v){var y=this,A;if(x){v.source=0;for(A in z){if(z.hasOwnProperty(A)&&A!=="lte"&&A!=="ctx"){y[A]=z[A]}}return y}}),q=/\w/;function m(D,x,w,z){var H=this,E={},C={},y={af:[],ar:[],nf:[],nr:[]},F,G,A,B;function v(I,J){if(I===D&&J<H.pkgs.length){return H.pkgs[J].inst}return i}for(F=0;A=D.pkgs[F];F++){if(typeof A.def.attrKey==="function"){y.af.push(A.def.attrKey)}else{if(A.def.attrKey instanceof a){y.ar.push(A.def.attrKey)}}if(typeof A.def.badKey==="function"){y.nf.push(A.def.badKey)}else{if(A.def.badKey instanceof a){y.nr.push(A.def.badKey)}}if(typeof A.def.prepTree==="function"&&typeof(B=A.def.prepTree.call(d,w))!=="undefined"){w=B}}H.nodes=o(w,D,y);H.nodes[0].parentIndex=H.nodes[0].childIndex=0;H.nodes.unshift(o()[0]);H.nodes[0].children.push(1);H.nodes[0].name="PNULL";H.nodes[0].index=H.nodes[0].depth=H.nodes[0].lte=0;H.nodes[0].path="..//";H.nodes[0].firstChildIndex=H.nodes[0].lastChildIndex=1;H.nodes[0].ctx=1;H.tank={id:n++,currentIndex:0,targetIndex:-1,go:function(I){var J=H.nodes[I];if(J){H.target=J;H.tank.targetIndex=J.index}H.stop=0;return H.go()},stop:function(){H.stop=1;return !!H.loop},post:function(I){var J=typeof I;if(H.loop){if(J==="function"){H.posts[++l]=I;return l}else{if(J==="number"){if(H.posts.hasOwnProperty(I)){delete H.posts[I];return true}}}}return false}};H.posts={};H.current=H.nodes[0];H.target=H.loop=0;H.pkgs=D.pkgs.map(function(I){var K=I.name,M=I.def,L={name:K,idx:I.idx,pkg:I,inst:new M()};function J(){}J.prototype=I.proxy.prototype;E[K]=L.proxy=new J();C[K]=L.inst;L.proxy.pkgs=E;L.proxy.toString=v;L.inst.pkgs=C;L.inst.tank=H.tank;L.inst.nodes=t.call(I.node,H.nodes);return L});for(F=0;A=H.pkgs[F];F++){A.inst.proxy=x}x.pkgs=E;x.toString=v;H.fire=j;for(F=0;A=H.pkgs[F];F++){if(typeof A.pkg.def.init==="function"){A.pkg.def.init.call(A.inst,z)}}delete H.fire}m.prototype={go:function(){var I=this,v=I.nodes,G=I.tank,w,z,B,y=0,H=I.stopped,A=I.current,E=H?A.lte:-1,F=-1,C=H?I.target.index:null,D,x;if(I.loop){return !!I.target}I.posts={};I.loop=1;I.fire("begin");while(I.loop){if((H||I.target)&&!I.stop){x=0;if(C!=I.target.index||!(~E|~F)){B=A.ctx===1;E=F=-1;C=I.target.index;z=C-A.index;if(z){if((z>0&&A.index<2)||!I.target.path.indexOf(A.path)){if(B){F=A.firstChildIndex}else{E=1}}else{if(B){E=2}else{if(I.target.path.indexOf(v[A.parentIndex].path)){z=-1}if(z>0){if(A.lte==3||A.lte==2){F=A.nextIndex}else{E=3}}else{if(A.lte==4||A.lte==2){F=~A.previousIndex?A.previousIndex:A.parentIndex}else{E=4}}}}}else{E=B?0:1}}else{if(~F){if(D){D=0;I.fire("release")}else{G.currentIndex=F;I.fire("node",F,A.index);A.lte=0;A=I.current=v[F];F=-1}}else{if(!D){D=1;I.fire("engage")}else{if(!B&&(E==1||E==2)){if(E==2){E=-1}else{B=A.ctx=1}I.fire("scope",A.ctx)}else{if(H){I.fire("traversing",E)}else{A.lte=E;if(!E){I.target=0;G.targetIndex=-1}I.fire("traverse",E)}y++;if(!I.stop){I.fire("traversed",E);I.stopped=0}I.stopped=I.stop;H=0;if(E==2){B=A.ctx=0}else{E=-1}}}}}}else{if(D){D=0;I.fire("release")}else{if(!x){x=1;I.fire("end")}else{I.loop=0}}}}for(w in I.posts){if(I.posts.hasOwnProperty(w)){I.posts[w].call(d)}}return y},fire:function(v){var x="on"+v.charAt(0).toUpperCase()+v.substr(1),w=arguments,A=0,z,y;for(;z=this.pkgs[A];A++){y=z.pkg.def[x];if(typeof y=="function"){y.apply(z.inst,w)}}}};function p(y,w){var v=this.pkgs[y-1],x;if(v&&w&&typeof w==="string"){x=new v.proxy();if(typeof x[w]==="function"){return x[w]}}return j}function u(w){var x=this,A;if(arguments.length){if(typeof w==="string"&&q.test(w)){if(!x.pkgsIdx.hasOwnProperty(w)){function z(B){if(B){return B instanceof x.pkgs[A].proxy&&B.toString(x,A)}}z.getSuper=function(B){return p.call(x,A,B)};z.init=z.attrKey=z.badKey=z.onBegin=z.onEnd=z.onNode=z.onEngage=z.onRelease=z.onScope=z.onTraverse=z.onTraversing=z.onTraversed=z.prepTree=z.prepNode=0;z.label=w;function v(){}v.prototype=new x.KlassProxy();x.Klass.prototype=z.proxy=v.prototype;x.KlassProxy=v;function y(){}z.node=y.prototype;A=z.index=x.pkgsIdx[w]=x.pkgs.push({name:w,idx:x.pkgs.length,def:z,proxy:v,node:y})-1}return x.pkgs[x.pkgsIdx[w]].def}return false}return x.pkgs.map(function(B){return B.name})}function j(){}return r}if(c){define(f)}else{if(g){module.exports=f(require)}else{if(!d.Panzer){d.Panzer=f()}}}}(typeof define=="function",typeof exports!="undefined",Array,Object,RegExp,this);