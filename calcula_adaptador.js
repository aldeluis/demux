#!/usr/local/bin/node
// cuenta nucleotidos por posición e imprime la combinación más frecuente
// entrada por stdin o por archivo de texto. La secuencia de un adaptador
// por linea, por ejemplo la salida de grep -o "AGATCG.*" 

fs=require('fs');

function sortWithIndices(toSort) {
  for (var i = 0; i < toSort.length; i++) {
    toSort[i] = [toSort[i], i];
  }
  toSort.sort(function(left, right) {
    return left[0] < right[0] ? -1 : 1;
  });
  toSort.sortIndices = [];
  for (var j = 0; j < toSort.length; j++) {
    toSort.sortIndices.push(toSort[j][1]);
    toSort[j] = toSort[j][0];
  }
  return toSort;
}

//var test = ['b', 'c', 'd', 'a'];
//sortWithIndices(test);
//console.warn(test.sortIndices.join(","));

var arguments = process.argv.splice(2);

if(arguments.length==1) stream = fs.ReadStream(arguments[0]);
else                    stream = fs.createReadStream("/dev/stdin");

var lastline="";
var nlinea=0;
var lineas=[];
var array_line=[];
var longitud=new Array();

DNA2i = {A:0,T:1,C:2,G:3,N:4};
i2DNA = {0:'A',1:'T',2:'C',3:'G',4:'N'};
mapea = function (x) {return DNA2i[x]};
desmapea = function (x) {return i2DNA[x]};

// inicialización del array de contaje de nucleotidos (ATCGN)
array_line_sum = new Array();
for (i = 0; i < 200; i += 1) {
array_line_sum[i] = [0,0,0,0,0];
}

stream.on('data', function(chunk) {
  chunk = lastline+chunk;            // añadimos la ultima linea del evento 'data' anterior
  lineas = chunk.split("\n");
  lastline = lineas.pop();           // guardamos la última linea, que suele estar incompleta.

  while (linea = lineas.shift()) {
    nlinea++;
    array_line = linea.split('').map(mapea);  // conversión de nt a indice
    for (i = 0; i < array_line.length; i++) {     
      array_line_sum[i][array_line[i]]++;   // adición de los indices
    }
  }
});

stream.on('end', function () {
  for (i=0; i < array_line_sum.length; i += 1) {
    longitud[i]=array_line_sum[i].reduce(function(pv, cv) { return pv + cv; }, 0); //suma para calcular la longitud
    sortWithIndices(array_line_sum[i]);
  }
  consensus=array_line_sum.map(function(x){return x.sortIndices[x.sortIndices.length-1]})
  process.stdout.write(consensus.map(desmapea).join('').substr(0,longitud.indexOf(0)));
//  console.warn("lineas:"+nlinea);
});
