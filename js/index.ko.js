async function GetFormulatOnline() {
    const response = await fetch("/json/formulat.json");
    return await response.json();
}

var formulatJson = [
    {
        "name": "Çmimi i rrymës 2022",
        "formula": "Gjithsej[€] = 0.19587 * Harxhimi[kWh]"
    },
    {
        "name": "tërheqja gravitacionale",
        "formula": "F[N] = 6.67259e-11 * m1[kg] * m2[kg] / (d[m] * d[m])"
    },
    {
        "name": "Energjia potenciale",
        "formula": "E[J] = 9.81[m/s²] * m[kg] * h[m]"
    },
    {
        "name": "E = mc²",
        "formula": "E[J] = m[kg] * 9e16"
    },
    {
        "name": "Ligji i Ohm-it",
        "formula": "I[A] = U[V] / R[Ohm]"
    }
];
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
            self.formulas(self.formulas().filter(f => f.name !== formula.name));
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
            const formulatOnline = await GetFormulatOnline();
            formulatOnline.forEach(f => {
                self.formulas.push(f);
            });
        }

        self.getFileText = function (file) {
            var reader = new FileReader();
            //reader.readAsDataURL(file);
            //reader.readAsArrayBuffer(file);
            reader.readAsText(file, "UTF-8");
            reader.onload = function () {
                const json = JSON.parse(reader.result);
                parentVM.IO.SaveLocally("formulas", json);
                self.loadFromLocalStorage();
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




const mainViewModel = new MainViewModel();

ko.applyBindings(mainViewModel);