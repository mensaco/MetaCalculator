var formulatJson = [];

class Preprocessor {
    constructor() {
        var self = this;
       
        self.Preprocess = function(){
            Array.from(document.querySelectorAll("PPSVG")).forEach(t => {
                const e = document.createElement("div");
                e.innerHTML = `
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="${t.getAttribute("d")}"
                                         />
                                </svg>`;

                t.replaceWith(e.firstElementChild);
            });
           
        }
    }
}

//përmban funksionet për shkrimin dhe leximin në localStorage të browserit
class IO {
    constructor() {
        var self = this;
        self.SaveLocally = function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        }

        self.GetLocally = function (key) {
            var json = localStorage.getItem(key);
            if (json === "undefined") {
                return null;
            }
            return JSON.parse(json);
        }
    }
}

/// përkufizon strukturën e një formuleje
class Formula {
    constructor(name, value, description) {
        this.name = ko.observable(name);
        this.formula = ko.observable(value);
        this.description = ko.observable(description);
    }
}

/// përmban të vrojtueshmet (observables) dhe funksionet që kanë të bëjnë me formulat
class Formulas {
    constructor(parentVM) {
        var self = this;
        self.formulas = ko.observableArray([]);

        self.formula = ko.observable("");
        self.email = ko.observable("");
        self.search = ko.observable("");

        self.compareByName = function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
            }
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
            }
            // a must be equal to b
            return 0;
        }

        self.validateEmail = ko.pureComputed(function () {
            if (self.email().length == 0) return false;
            return self.email().match(
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        });

        self.showFormulas = ko.observable(false);
        self.showFormulasText = function () {
            return self.showFormulas() ? "fshih formulat" : "paraqit formulat";
        }


        self.loadFromLocalStorage = function () {
            const fs = parentVM.IO.GetLocally("formulas");
            if (fs) {
                fs.sort(self.compareByName);
                self.formulas(fs);
            }
        }

        self.saveToLocalStorage = function () {
            parentVM.IO.SaveLocally("formulas", self.formulas());
        }

        self.loadFromLocalStorage();



        if (self.formulas().length == 0) { //nëse ka krisur kiameti
            self.formulas(formulatJson);
            self.saveToLocalStorage();
        }



        const last_formula = parentVM.IO.GetLocally("last_formula");
        if (last_formula) {
            self.formula(last_formula);
        }
        else {
            self.formula = ko.observable(
                self.formulas()[0]
            );
        }

        self.newFormula = ko.observable();

        self.Definitions = function () {
            return ko.toJSON(self.formulas(), null, 2);
        }

        self.Select = function (cf) {
            self.formula(cf);
            parentVM.IO.SaveLocally("last_formula", self.formula());
            parentVM.view("default");
        }

        self.Get = function (name) {
            return self.formulas().find(f => f.name === name);
        }

        self.Create = function (formula) {
            self.formulas.push(formula);
            self.saveToLocalStorage();
        }

        self.Update = function (formula) {
            var cf = self.Get(formula.name);
            if (cf) {
                cf.name = formula.name;
                cf.value = formula.value;
            }
            self.saveToLocalStorage();
        }

        self.Delete = function (formula) {
            //self.formulas(self.formulas().filter(f => f.name !== formula.name));
            //const todelete = self.formulas().find(f => f.name !== formula.name);
            var i = 0;
            for (; i < self.formulas().length; i++) {
                const f = self.formulas()[i];
                if(f.name == formula.name && f.formula == formula.formula){
                    self.formulas.splice(i,1);
                    break;
                }               
            }
            self.saveToLocalStorage();
        }

        self.Download = function () {

            function download(filename, text) {
                var element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                element.setAttribute('download', filename);

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            }

            // Start file download.
            download(`metacalculator.formulat.${new Date().toISOString().replace(/[\-\:TZ]/gm, '').split('.')[0].substring(2)}.json`, self.Definitions());

        }

        self.GetFormulatOnline = async function(){
            const response = await fetch("/json/formulat.json");     
            const formulatOnline = await response.json();
            
            formulatOnline.forEach(f => {
                if(!self.formulas().some(s => s.name == f.name && s.formula == f.formula && ((s.description??"xyz") ==  (f.description??"xyz")))){
                    self.formulas.push(f);
                }
            });

            self.saveToLocalStorage();
        }

        self.getFileText = function (file) {
            var reader = new FileReader();
            //reader.readAsDataURL(file);
            //reader.readAsArrayBuffer(file);
            reader.readAsText(file, "UTF-8");
            reader.onload = function () {
                const json = JSON.parse(reader.result);

                json.forEach(f => {
                    if(!self.formulas().some(s => s.name == f.name && s.formula == f.formula && ((s.description??"xyz") ==  (f.description??"xyz")))){
                        self.formulas.push(f);
                    }
                });
                self.saveToLocalStorage();
                // parentVM.IO.SaveLocally("formulas", json);
                // self.loadFromLocalStorage();
            };
            reader.onerror = function (error) {
                console.log('Error: ', error);
            };
        }

        self.fileChanged = function (e) {
            var files = e.target.files;
            var file = files[0];
            self.getFileText(file);
        }

        self.Copy = function () {
            navigator.clipboard.writeText(self.Definitions());
        }

        self.PrepMail = function (encodeduri) {
            window.location = encodeduri;
        }

        self.Email = function () {
            if (self.validateEmail()) {
                const url = `mailto:${self.email()}?subject=${encodeURI('MetaCalculator - përkufizimet e formulave ')}&body=${self.Definitions()}`;
                self.PrepMail(url);
            }
        }

        self.filtered = ko.pureComputed(function () {

            var ra;

            if (self.search() == "") {
                ra = self.formulas();
            }
            else {
                ra = self.formulas().filter(f => f.name.toLowerCase().includes(self.search().toLowerCase()));
            }

            ra.sort(self.compareByName);
            return ra;
        }

        );

    }
}

/// përman të vrojtueshmet dhe funksionet që përkthejnë formulën në një konstrukt të kuptueshëm për të llogaritur vlerat e saj
/// nga javascript
class Parser {
    constructor(parentVM) {
        var self = this;

        self.variables = ko.observableArray([]);
        self.compactFormula = ko.observable("");

        self.canCompute = ko.observable(false);
        self.empty = ko.observable("");
        self.cleanUpSpaces = function (array) {
            for (var i = 0; i < array.length; i++) {
                array[i] = array[i].replace(/ /gm, "");
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
                        f = f.replace(v.label(), `${v.name} * 1`);
                    }
                });

                // demasko funksionet matematikore
                f = f.replace(/_mfunct/gm, "Math.");

                // ruaje formulen kompakte
                self.compactFormula(f);




                self.canCompute(true);
                return self;

            }
            else {
                //todo: alert user about the wrong format of the equation
                self.variables([]);
                self.compactFormula("");
                self.left("");
                self.right("");

                return self;
            }

        });

        // vlera e llogaritjes
        self.computed = function () {

            if (self.canCompute() == true) {
                var f = self.compactFormula();
                if (!f) return "";
                f = f.replace(/_v(\d+)/gm, "self.variables()[$1].value()");

                try {
                    return eval(f);
                }
                catch (e) {
                    return "";
                }

            }
            else {
                return "";
            }

        };
    }

}

/// Modeli kryesor i pamjes (ViewModel)
/// lidh të gjitha pjesët dhe koordinon gjithçka nga niveli më i sipërm i programit
class MainViewModel {
    constructor() {
        const self = this;

        self.view = ko.observable("default");
        self.IO = new IO();

        self.Formulas = new Formulas(self);

        self.Parser = new Parser(self);

        self.addNewFormula = function () {

            self.Formulas.newFormula(new Formula("", ""));
            self.view("add")
        }

        self.saveNewFormula = function () {
            self.Formulas.Create(ko.toJS(mainViewModel.Formulas.newFormula()));
            self.view("formulat");
        }


    }
}

const PP = new Preprocessor();
PP.Preprocess();


const mainViewModel = new MainViewModel();

ko.applyBindings(mainViewModel);