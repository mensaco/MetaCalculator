class Parser {
    constructor(parentVM) {
        var self = this;

        self.constants = ko.observableArray([]);
        self.variables = ko.observableArray([]);
        self.compactFormula = ko.observable("");

        self.canCompute = ko.observable(false);
        self.empty = ko.observable("");
        self.cleanUpSpaces = function (array) {
            for (var i = 0; i < array.length; i++) {
                array[i] = array[i].replace(/ /gm,"");
            }
        }


        self.left = ko.observable();
        self.right = ko.observable();

        self.parsed = ko.pureComputed(function () {
            self.canCompute(false);
            var f = parentVM.formula();
            f = f.replace(/ /g, "");
            const parts = f.split("=");
            if (parts.length == 2) {
                self.left(parts[0]);
                f = parts[1];
                self.right(f);

                // gjeji konstantet me notacion shkencor #.#e[ +-]#.###
                var regexMatches = f.match(/(\d+\.*\d+e[-+]?\d+)/gm);
                var uniqueMatches = Array.from(new Set(regexMatches)); // merr vetem unikatet
                self.cleanUpSpaces(uniqueMatches); // clean up
                uniqueMatches.forEach((m, i) => { // itero
                    // krijo konstanten
                    const c = {
                        "name": `_c${i}`, "value": ko.observable(m.trim())
                    };
                    // fute ne observableArray
                    const foundConstant = self.constants().find(cc => cc.name === c.name);
                    if (!foundConstant) {
                        self.constants.push(c);
                    }
                    else {
                        foundConstant.value(c.value());
                    }


                });

                // masko funksionet 
                f = f.replace(/Math\./gm, "_mfunct");


                // rrethoji me karakter bosh
                f = " " + f.replace(/([+-\/*\(\)])/gm, " $1 ") + " ";

                // perpuno ndryshoret me njesi (SI)
                regexMatches = f.match(/\W[a-zA-Z]+_?[a-zA-Z0-9]*(\[.*?\])?\W/gm);

                var uniqueMatches = Array.from(new Set(regexMatches)); // merr vetem unikatet
                self.cleanUpSpaces(uniqueMatches); // clean up
                uniqueMatches.forEach((m, i) => { // itero
                    // krijo konstanten
                    var v = {
                        "name": `_v${i}`, "label": ko.observable(m), "value": ko.observable(0)
                    };

                    // fute ne observableArray
                    const foundVariable = self.variables().find(vv => vv.name === v.name);
                    if (!foundVariable) { // nuk eshte prezente
                        self.variables.push(v);
                    }
                    else {
                        foundVariable.label(v.label());
                    }

                });

                // largo ndryshoret e paperdorura 
                const tokeep = self.variables().filter(v => uniqueMatches.some(um => um == v.label()));
                const toremove = self.variables().filter(v => !uniqueMatches.some(um => um == v.label()));
                self.variables(tokeep);

                f = self.right();

                // zevendeso te gjitha rastet e konstanteve ne formule
                self.constants().forEach(c => {
                    while (f.includes(c.value())) {
                        f = f.replace(c.value(), c.name);
                    }
                });


                // zevendeso te gjitha rastet e ndryshoreve ne formule
                self.variables().forEach(v => {
                    while (f.includes(v.label())) {
                        f = f.replace(v.label(), v.name);
                    }
                });

                // demasko funksionet
                f = f.replace(/_mfunct/gm, "Math.");

                // ruaje formulen kompakte
                self.compactFormula(f);




                self.canCompute(true);
                return self;

            }
            else {
                //todo: alert user about the wrong format of the equation
                return self;
            }

        });

        // vlera e llogaritjes
        self.computed = function () {

            if(self.canCompute() == true){
                var f = self.compactFormula();
                if (!f) return "";
                f = f.replace(/_v(\d+)/gm, "self.variables()[$1].value()");
                f = f.replace(/_c(\d+)/gm, "self.constants()[$1].value()");
    
                return eval(f);
            }
            else{
                return "";
            }
            
        };
    }

}


class MainViewModel {
    constructor() {
        const self = this;

        self.formula = ko.observable("F[N] = 6.67259e-11 * m1[kg] * m2[kg] / (d[m] * d[m])");

        self.Parser = new Parser(self);


    }
}


const mainViewModel = new MainViewModel();

ko.bindingHandlers['dhtml'] = {
    'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
        //ko.applyBindingsToDescendants(bindingContext, element);
    }
};


ko.applyBindings(mainViewModel);