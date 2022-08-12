class IO {
    constructor() {
        var self = this;
        self.GetLocalString = function (name) {
            return localStorage.getItem(name);
        };

        self.SetLocalString = function (name, value) {
            localStorage.setItem(name, value);
        };

        self.GetLocalObject = function (name) {
            // todo: add sanity check
            return JSON.parse(self.GetLocalString(name));
        };

        self.SetLocalObject = function (name, value) {
            // todo: add sanity check
            this.SetLocalString(name, JSON.stringify(value));
        };
    }
}

class Models {
    constructor(io) {
        var self = this;
        self.models = io.GetLocalObject("models");

        self.updateLocal = function () {
            io.SetLocalObject("models", self.models);
        };

        self.GetModels = function () {
            return self.models;
        };

        self.GetModel = function (name) {
            return self.models[name];
        };
        self.CreateModel = function (name, model) {
            if (!self.GetModel(name)) { // only if not existing
                self.models[name] = model;
                io.SetLocalObject(self.name, self.models);
            }
            else {
                // todo: inform user model exists
            }
        };

        self.UpdateModel = function (name, model) {
            if (self.GetModel(name)) { // only if existing
                self.models[name] = model;
                io.SetLocalObject(self.name, self.models);
            }
            else {
                // todo: inform user model exists not
            }
        };

        self.DeleteModel = function (name) {
            if (self.GetModel(name)) { // only if existing
                delete self.models[name];
                io.SetLocalObject(self.name, self.models);
            }
            else {
                // todo: inform user model exists not
            }
        };


    }
}

class Inputs {
    constructor() {
        const self = this;
        self.inputs = ko.observable({});

        self.AddInput = function (bindingName) {
            console.log(`Adding observed input "${bindingName}"`)
            self.inputs()[bindingName] = ko.observable();
        };

    }
}

class Parser {
    constructor() {
        var self = this;

        self.constants = {};
        self.variables = {};

        self.prepare = function () {
            var f = self.formula();
            f = f.replace(/ /g, "");
            const parts = f.split("=");
            if (parts.length == 2) {
                self.left = parts[0];
                f = parts[1];

                // replace constant numbers in scientific notation
                var matches = f.match(/(\d+\.*\d+e[-+]?\d+)/gm);
                var matchesSet = {};  
                var c = 0;
                for (let mi = 0; mi < matches.length; mi++){
                    const mm = matches[mi].trim();
                    if(!matchesSet[mm]){
                        matchesSet[mm] = c;
                        c++;
                    }
                }
                for (const match in matchesSet) {
                    if (Object.hasOwnProperty.call(matchesSet, match)) {
                        self.constants[`c${matchesSet[match]}`] = match;
                        while(f.includes(match)){
                            f = f.replace(match, `_c${matchesSet[match]}`);
                        }
                        
                    }
                }

                // put spacing around operators for good measure
                f = f.replace(/([+-\/*\(\)])/gm, " $1 ");
                //console.log(f);

                // process variables with (SI) units
                matches = f.match(/\W[a-zA-Z]+_?[a-zA-Z0-9]*(\[.*?\])?\W/gm);
                matchesSet = {};
                c = 0;
                for (let mi = 0; mi < matches.length; mi++){
                    const mm = matches[mi].trim();
                    if(!matchesSet[mm]){
                        matchesSet[mm] = c;
                        c++;
                    }
                }
                for (const match in matchesSet) {
                    if (Object.hasOwnProperty.call(matchesSet, match)) {
                        self.variables[`v${matchesSet[match]}`] = match;
                        while(f.includes(match)){
                            f = f.replace(match, `_v${matchesSet[match]}`);
                        }
                    }
                }

                
                return f;
            }
            else {
                return f;
            }
        }

        // F[N] = 6.67259e-11 * m1[kg] * m2[kg] / (d[m] * d[m]) 
        self.formula = ko.observable("F[N] = 6.67259e-11  * x  * m1[kg] * m2[kg] / (d[m] * d[m])");
        self.parsedOutput = function () {
            var res = {};
            const parts = self.formula().split('=');
            if (parts.length == 2) {
                const o = parts[0].match(/(.*?)\[(.*?)\]/);
                res.Output = {
                    "text": o[0],
                    "quantity": o[1],
                    "unit": o[2]
                }



                const dummy = 0;
            }
            else {
                //todo: inform the user about the wrong formula format
                console.log("wrong formula format.")
            }
        }
    }
}



class ViewModel {
    constructor() {
        var self = this;

        self.IO = new IO();
        self.Models = new Models(self.IO);
        self.Inputs = new Inputs();
        self.Parser = new Parser();
        self.Html = function () {
            var h = "";
            for (const i in self.Inputs.inputs()) {
                if (Object.hasOwnProperty.call(self.Inputs.inputs(), i)) {
                    const input = self.Inputs.inputs()[i];
                    h += `
                <div data-bind="text: Inputs.inputs().${i}" data-binding-name="${i}"></div>
                <div class="flex justify-start items-center my-2" data-binding-name="${i}">
                    <div class="w-20">${i}</div>
                    <input type="text" data-bind="value: Inputs.inputs().${i}" class="form-control">
                </div>
                `;
                }
            }

            h += `
                
                <div class="flex justify-start items-center my-2" data-binding-name="Output">
                    <div class="w-20">Output:</div>
                    <input type="text" data-bind="value: Output()" class="form-control">
                </div>
                `;

            return h;
        }

        self.Output = function () {
            return self.Inputs.inputs().input_0() * self.Inputs.inputs().input_1();
        };

        self.input = ko.observable();
    }
}

ko.bindingHandlers['dhtml'] = {
    'update': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
        //ko.applyBindingsToDescendants(bindingContext, element);
    }
};




var appliedModel = new ViewModel();






for (let index = 0; index < 5; index++) {
    const bindingName = `input_${index}`;
    appliedModel.Inputs.AddInput(bindingName);
}


ko.applyBindings(appliedModel);