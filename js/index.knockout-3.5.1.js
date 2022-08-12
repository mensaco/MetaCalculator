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

class Outputs{
    constructor() {
        var self = this;
        //self.outputs = 

    }
}

class ViewModel {
    constructor() {
        var self = this;

        self.IO = new IO();
        self.Models = new Models(self.IO);
        self.Inputs = new Inputs();
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
            return h;
        }
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