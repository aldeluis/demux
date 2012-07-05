// Este programa necesita de una entrada A TRAVÉS DE STDIN!! compuesta por las lecturas principales
// y las lecturas de los indices en la ultima columna
//
// Se supone el mismo orden de lectura de spots en los dos archivos.
// La salida es qseq
//
// El argumento solo sirve como prefijo para los archivos de salida

var fs  = require('fs');
var ee = require('events').EventEmitter;
var args = process.argv.splice(2);      // prefijo para los archivos de salida

function numberSequence(count, content) {
   var result = [];
   if(typeof(content) == "function") {
      for(var i=0; i<count; i++) {
         result.push(content(i));
      }
   } else {
      for(var i=0; i<count; i++) {
         result.push(content);
      }
   }
   return result;
}

Array.prototype.sum = function(){
	for(var i=0,sum=0;i<this.length;sum+=this[i++]);
	return sum;
}
Array.prototype.max = function(){
	return Math.max.apply({},this)
}
Array.prototype.min = function(){
	return Math.min.apply({},this)
}

function hamdist(s1,s2)
{    
   var distance = 0;
   for(var i = 0; i < s1.length; i++)
      if (s1.charAt(i) != s2.charAt(i))
        distance++;
   return distance;
}

function hamming (indice,secuencia) {
  return (
//      hamdist(secuencia,indice)
    Math.min(
      hamdist(secuencia.substring(0,6),indice),
      hamdist(secuencia.substring(1,6),indice),
      hamdist(secuencia.substring(0,6),indice.substring(1,6)),
      hamdist(secuencia.substring(1,6),indice.substring(1,6))
      )
    );  
  }

var r = fs.createReadStream("/dev/stdin");
//var indices=["ATCACG","CGATGT","TTAGGC","TGACCA","ACAGTG","GCCAAT","CAGATC","ACTTGA","GATCAG","TAGCTT","GGCTAC","CTTGTA","resto"];
var indices   =  ['ATCACGA','CGATGTA','TTAGGCA','TGACCAA','ACAGTGA','GCCAATA','CAGATCA','ACTTGAA','GATCAGA','TAGCTTA','GGCTACA','CTTGTAA','AGTCAAC','AGTTCCG','ATGTCAG','CCGTCCC','GTCCGCA','GTGAAAC','GTGGCCT','GTTTCGG','CGTACGT','GAGTGGA','ACTGATA','ATTCCTT','resto'];
var streams=indices.map(function(index){return fs.createWriteStream(args[0]+"_"+index+".qseq")});
var wbufs=indices.map(function(){return new Array()});
var nbufs=indices.map(function(){return new Array()});

interval=setInterval(function(){
  var memoria=process.memoryUsage().heapUsed;
//  process.stdout.write(nlinea+" "+nbufs.map(function(a){return a})+" "+process.memoryUsage().heapUsed+"\r")
  if (memoria>300000000) {distribuye();}
  },1000);

var lastline="";
var lineas=[];
var nlinea=0;

r.on('data', function(chunk) {
  chunk=lastline+chunk;            // añadimos la ultima linea del evento 'data' anterior
  lineas=chunk.split("\n");
  lastline=lineas.pop();           // guardamos la última linea, que suele estar incompleta.

  while (linea=lineas.shift()) {
    nlinea++
    var campos=linea.split("\t");
    var secuencia=campos.pop();
    var dist_arr=indices.slice(0,indices.length-1).map(function(indice) {return(hamming(indice,secuencia));});
  //process.stdout.write("\n"+dist_arr);
    var indice_encontrado=dist_arr.indexOf(0);
      if (indice_encontrado!=-1) {
        // a su indice, primer intento con indice hamming 0 
        //this.emit("indice_linea",nlinea,indice_encontrado,0,calidad);
        nbufs[indice_encontrado]++;
        wbufs[indice_encontrado].push(campos.join("\t"));
        }
      else {
        indice_encontrado=dist_arr.indexOf(1);
        if (indice_encontrado!=-1) {
          // a su indice, segundo intento con indice hamming 1 
          //this.emit("indice_linea",nlinea,indice_encontrado,1,calidad);
          nbufs[indice_encontrado]++;
          wbufs[indice_encontrado].push(campos.join("\t"));
          }
        else {
          // a resto
          //this.emit("indice_linea",nlinea,indices.length-1,1,calidad);
          nbufs[indices.length-1]++;
          wbufs[indices.length-1].push(campos.join("\t"));
          }
        }
    }
  });

r.on('end', function() {
  clearInterval(interval);
  console.log("final");
  console.log(nlinea);
  console.log(nbufs.map(function(a){return a}));
  console.log(nbufs.sum());
  distribuye();
  });

function distribuye () {
  copia_wbufs=wbufs;
  wbufs=indices.map(function(){return new Array()});
  var numeros=numberSequence(indices.length,function(i){return i++});
  numeros.map(function(i){
    if (copia_wbufs[i].length>0) streams[i].write(copia_wbufs[i].join("\n")+"\n");
    });
  }
