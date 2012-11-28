#!/usr/local/bin/node
// corta el adaptador
// entrada por stdin.
// el argumento es la secuencia del adaptador.
//
// Código sujeto a licencia GPLv3 (ver archivo COPYING)
// Copyright (c) 2012, by Alberto de Luis <alberto@deluis.es>

//require("v8-profiler");
fs=require('fs');

var arguments = process.argv.splice(2);
if(arguments.length==1) adapter = arguments[0];
else                    {console.error("falta la secuencia del adaptador");process.exit()}

var readstream  = fs.createReadStream ("/dev/stdin",  {encoding:'ascii'});
var writestream = fs.createWriteStream("/dev/stdout", {encoding:'ascii'});


// tabla de cortes del adaptador (con un precalculo nos ahorramos muchos cálculos posteriores)
var arr_subada=new Array();
var lenada=m=adapter.length;
var subada="";
var i=0;

while (i<m) {
  subada=subada+adapter[i];              // forma rapida de cortar el adaptador
  arr_subada[i]=subada;
  i++;
  }
//console.warn(arr_subada);  

// Alineamiento naive desde el final de la secuencia
// devuelve punto de corte
desliza = function (seq) {
  var P=N=l=i=0;
  var r='';
  var n=seq.length;
  var lenseq=n;
  var pos_corte=n;
  var subseq="";
  var j=0;
  var u;

  while (--n>=0) {
    subseq=seq[n]+subseq; // subsecuencias añadiendo nucleotidos por la izquierda.
    u=lenada-j-1;
    if (u<0) subseq[subseq.length+u]='';    // cortado de la secuencia por el otro lado para que tenga la misma longitud que el adaptador
    var i=(j<lenada)?j:lenada-1;            // indice del array de fragmentos de adaptador

    P=N=0;
    l=i;
    while (l>=0) {
      (subseq[l]==arr_subada[i][l])?P++:N++;
      l--;
      }

    porcentaje=(P/(i+1));

    if (porcentaje>0.8) {
      pos_corte=n;
//    console.warn(subseq+" "+porcentaje+" "+pos_corte+"\n"+arr_subada[i]);
      }
    j++;
    }
  return (pos_corte);
  }

String.prototype.repeat = function(num)
  {return new Array(num+1).join(this)}

last_nblock=0;
interval = setInterval(function(){
//  var memoria=process.memoryUsage().heapUsed;
//  process.stderr.write("nblock:"+nblock+" blocks chars:"+buffer_blocks.length+" "+(nblock-last_nblock)+" blocks/s "+process.memoryUsage().heapUsed+"\n")
//  last_nblock=nblock;
  //if (memoria>10000000) {readstream.pause();distribuye();}
  if (buffer_n>50000) {readstream.pause();distribuye();}
  },1000);

writestream.on('drain',function(){readstream.resume()});

var lastline="";
var lineas=[];
//var fastq_block=[];
var buffer_blocks="";
var buffer_n=0;
var nblock=0;

readstream.on('data', function(chunk) {
  chunk = lastline+chunk;            // añadimos la ultima linea del evento 'data' anterior
  lineas = lineas.concat(chunk.split("\n"));
//  process.stderr.write(lineas.length+"\n");
  lastline = lineas.pop();           // guardamos la última linea, que suele estar incompleta.

  while (lineas.length>3) {
    linea=lineas.shift();
    if (linea[0]=='@') {
      var id=linea;
      var seq=lineas.shift();
      lineas.shift();
      var qual=lineas.shift();

      pos_corte=desliza(seq);

      if (pos_corte<seq.length) {
        // corte
        seq=seq.substr(0,pos_corte);
        qual=qual.substr(0,pos_corte);
        // relleno de N (fermi)
//        seq=seq.substr(0,pos_corte)+'N'.repeat(seq.length-pos_corte);
//        qual=qual.substr(0,pos_corte)+'B'.repeat(qual.length-pos_corte);
        }
      buffer_blocks+=(id+'\n'+seq+'\n+\n'+qual+'\n');
      buffer_n++;
      nblock++;
      }
  }
});

readstream.on('end', function () {
  distribuye();
  clearInterval(interval);
//  process.stderr.write("fastq blocks:"+nblock);
});

function distribuye () {
  if (buffer_blocks.length>0) {
    writestream.write(buffer_blocks);
    buffer_blocks="";
    buffer_n=0;
  }
  else {
    readstream.resume();  
    }
}

