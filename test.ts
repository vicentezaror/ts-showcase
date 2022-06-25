import * as data from './data.json';
// Supuesto: La información de los productos está en el archivo data.json

// Supuesto: La información se estructura de esta forma (como se ve en data.json)
const productData: { [key: string]: { // Nombre del producto
                        [key: string]: { // Opción
                            [key: string]: { // Valor
                                [key: string]: boolean // Disponibilidad
                            }
                        }
                    } } = data;

// Función #1      
// Supuesto: Recibe el nombre de un producto
function getOptionsArray(product: string): object[] {
    try {
        var optionsArray: { [key: string]: string | string[] }[] = [];
        for (var option in productData[product]) {
            var optionValues: string[] = [];
            for (var value in productData[product][option]) {
                if (productData[product][option][value].available){
                    optionValues.push(value);
                }
            }
            optionsArray.push({ 'opción': option, 'valores': optionValues });
        }
        return optionsArray;
    } catch (error) {
        return [{'Error': error}]
    }
}

// Helpers función #2:
// Helper para conocer las últimas hojas del árbol
function getLastChildOptionName(graph: any): any {
    if (Object.keys(Object.values(graph.valores)[0]).length === 0) {
        return graph.opción;
    } else {
        return getLastChildOptionName(Object.values(graph.valores)[0]);
    }
}

// Helper para anidar nodos
function nestNode(graph: any, option: any): any {
    var newGraph: any = {...graph}

    const lastChildOptionName: any = getLastChildOptionName(newGraph);

    if (newGraph.opción === lastChildOptionName) {
        for (var valor in newGraph.valores) {
            newGraph.valores[valor] = {'opción': Object.keys(option)[0], 'valores': {}}
            newGraph.valores[valor].valores = {}
            for (var subValor in Object.values(option)[0]) {
                if (Object.values(option)[0][subValor].available) {
                    newGraph.valores[valor].valores[subValor] = {}
                }
            }
        }
    } else {
        for (var valor in newGraph.valores) {
            newGraph.valores[valor] = nestNode(newGraph.valores[valor], option)
        }
    }
    return newGraph;
}

// Helper para establecer código SKU
function setSKUCodes(graph: any, productName: string, skuCode: string = ''): any {
    var skuNewGraph: any = graph;
    const lastChildOptionName = getLastChildOptionName(graph);
    if (skuNewGraph.opción === lastChildOptionName) {
        for (var valor in skuNewGraph.valores) {
            skuNewGraph.valores[valor] = { sku: `${productName}-${skuCode}-${valor}` };
        }
    } else {
        for (var valor in skuNewGraph.valores) {
            skuNewGraph.valores[valor] = setSKUCodes(skuNewGraph.valores[valor],
                                                    productName,
                                                    skuCode=valor);
        }
    }
    return skuNewGraph;
}

// Helper para construir estructura de grafo tipo árbol
function buildGraph(rootOption: string, productOptions: any, productName: string): any {
    var graph: any = {};
    var addedOptions: string[] = [];
    addedOptions.push(rootOption)
    graph['opción'] = rootOption;
    graph['valores'] = {};
    for (var value in productOptions[rootOption]) {
        graph['valores'][value] = {}
    }
    for (var option in productOptions) {
        if (!(addedOptions.includes(option))) {
            var optionObject = {[option]: productOptions[option]}
            graph = nestNode(graph, optionObject);
            addedOptions.push(option);
        }
    }
    const newGraph = setSKUCodes(graph, productName=productName);
    return newGraph;
}

// Función #2:
// Supuesto: Al igual que la función anterior, esta recibe el nombre de un producto
function getOptionsTree(product: string, chosenRoot: string = ''): object {
    try {
        // Definición de raíz del árbol
        var rootOption = '';
        if (chosenRoot === '') {
            rootOption = Object.keys(productData[product])[0];
        } else {
            if (!(chosenRoot in productData[product])) {
                throw 'La opción no existe o está mal escrita'
            } else {
                rootOption = chosenRoot;
            }
        }

        return buildGraph(rootOption, productData[product], product);

    } catch (error) {
        return {'Error': error}
    }
}

// // // Ejemplos
//
// // Función 1:
// console.log(getOptionsArray('polera'));
// console.log(getOptionsArray('calcetin'));
// console.log(getOptionsArray('gorro'));
// console.log(getOptionsArray('otro'));
//
// // Función 2:
// console.log(getOptionsTree('polera', 'color'));
// console.log(getOptionsTree('calcetin', 'tamaño'));
// console.log(getOptionsTree('gorro'));
// console.log(getOptionsTree('otro'));
//
// // //