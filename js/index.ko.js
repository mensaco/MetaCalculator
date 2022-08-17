class IO {
    constructor(){
        var self = this;
        self.SaveLocally = function(key, value){
            localStorage.setItem(key, JSON.stringify(value));
        }

        self.GetLocally = function(key){
            var json = localStorage.getItem(key);
            if(json === "undefined") {
                return null;
            }
            return JSON.parse(json);
        }
    }
}

class Formula {
    constructor(name, value) {
        this.name = ko.observable(name);
        this.formula = ko.observable(value);
    }
}

class Formulas {
    constructor(parentVM) {
        var self = this;
        self.formulas = ko.observableArray([]);

        self.showFormulas = ko.observable(false);
        self.showFormulasText = function(){
            return self.showFormulas() ? "fshih formulat": "paraqit formulat";
        } 


        const fs = parentVM.IO.GetLocally("formulas");
        if(fs){
            fs.sort((a,b) => a.name < b.name);
            self.formulas(fs);
        }

        self.formula = ko.observable(
            {
                "name":"tërheqja gravitacionale",
                "formula": "F[N] = 6.67259e-11 * m1[kg] * m2[kg] / (d[m] * d[m])"
            }
        );
        
        const last_formula = parentVM.IO.GetLocally("last_formula");
        if(last_formula){
            self.formula(last_formula);
        }

        self.newFormula = ko.observable();

        self.Get = function(name){
            return self.formulas().find(f => f.name === name);
        }

        self.Create = function(formula){
            self.formulas.push(formula);
            parentVM.IO.SaveLocally("formulas", self.formulas());
        }

        self.Update = function(formula){
            var cf = self.Get(formula.name);
            if(cf){
                cf.name = formula.name;
                cf.value = formula.value;
            }
            parentVM.IO.SaveLocally("formulas", self.formulas());
        }

        self.Delete = function(formula) {
            // var cf = self.Get(formula.name);
            // if(cf){
            //     delete self.formulas[formula];
            // }
            self.formulas(self.formulas().filter(f => f.name !== formula.name));
            parentVM.IO.SaveLocally("formulas", self.formulas());
        }


    }
}
class Parser {
    constructor(parentVM) {
        var self = this;

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
            var f = parentVM.Formulas.formula().formula;
            f = f.replace(/ /g, "");
            const parts = f.split("=");
            if (parts.length == 2) {
                self.left(parts[0]);
                f = parts[1];
                self.right(f);

                // masko funksionet 
                f = f.replace(/Math\./gm, "_mfunct");


                // rrethoji me karakter bosh
                f = " " + f.replace(/([+-\/*\(\)])/gm, " $1 ") + " ";

                // perpuno ndryshoret me njesi (SI)
                const regexMatches = f.match(/\W[a-zA-Z]+_?[a-zA-Z0-9]*(\[.*?\])?\W/gm);

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
        
        self.view = ko.observable("default");
        self.IO = new IO();

        //self.formula = ko.observable("F[N] = 6.67259e-11 * m1[kg] * m2[kg] / (d[m] * d[m])");


        self.Formulas = new Formulas(self);
        
        self.Parser = new Parser(self);
        
        self.addNewFormula = function(){
            //self.Formulas.newFormula.name("formula e re");
            //self.Formulas.newFormula.formula(self.Formulas.formula().formula);
            self.Formulas.newFormula(new Formula("",""));
            self.view("add")
        }

        self.saveNewFormula = function(){
            self.Formulas.Create(ko.toJS(mainViewModel.Formulas.newFormula()));
            self.view("default");
        }

        
        
        
    }
}


const mainViewModel = new MainViewModel();

ko.applyBindings(mainViewModel);