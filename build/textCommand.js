import { ConsumeMode, } from './types.js';
class VxppyOption {
    name;
    _required = false;
    _consumes = undefined;
    _default = undefined;
    _enum;
    _description;
    constructor(name) {
        this.name = name;
    }
    enum(...values) {
        this._enum = values;
        return this;
    }
    required(state = true) {
        this._required = state;
        return this;
    }
    consumes(state = ConsumeMode.Raw) {
        this._consumes = state;
        return this;
    }
    description(description) {
        this._description = description;
        return this;
    }
    default(value) {
        this._default = value;
        return this;
    }
    get Data() {
        return {
            name: this.name,
            required: this._required,
            consumes: this._consumes,
            description: this._description,
            enum: this._enum,
            default: this._default,
        };
    }
}
class VxppyCommandCore {
    name;
    _children = [];
    _hasSubCommands = false;
    _hasOptions = false;
    _description;
    constructor(name) {
        this.name = name;
    }
    hasSubCommands() {
        return this._hasSubCommands;
    }
    hasOptions() {
        return this._hasOptions;
    }
    get Description() {
        return this._description;
    }
    get Name() {
        return this.name;
    }
    description(description) {
        this._description = description;
        return this;
    }
    option(name, transform) {
        if (this._hasSubCommands) {
            throw new Error("Subcommands and options can't exist on the same command");
        }
        this._hasOptions = true;
        let option = new VxppyOption(name);
        if (transform) {
            option = transform(option);
        }
        // @ts-ignore
        this._children.push(option.data);
        return this;
    }
    subCommand(name, transform) {
        if (this._hasOptions) {
            throw new Error("Subcommands and options can't exist on the same command");
        }
        this._hasSubCommands = true;
        let option = new VxppyTextSubCommand(name);
        if (transform) {
            option = transform(option);
        }
        // @ts-ignore
        this._children.push({
            name,
            subCommand: option,
        });
        return this;
    }
}
class VxppyTextSubCommand extends VxppyCommandCore {
    get Options() {
        return this._children;
    }
}
class VxppyTextCommand extends VxppyCommandCore {
    get Options() {
        return this._children;
    }
    _props = {};
    _alias;
    _fn;
    get Aliases() {
        return this._alias;
    }
    alias(...aliases) {
        this._alias = aliases;
        return this;
    }
    props(props) {
        this._props = { ...this._props, ...props };
        return this;
    }
    getProp(prop) {
        return this._props[prop];
    }
    matchName(name) {
        return this.name == name || this._alias?.includes(name);
    }
    callback(callback) {
        this._fn = callback.bind(this);
        return this;
    }
    async execute(message, options, ctx) {
        await this._fn?.({ message, options, ctx });
    }
}
/**
 * Create a VxppyTextCommand
 *
 * @param name Name of the command
 */
export function textCommand(name) {
    return new VxppyTextCommand(name);
}
export { VxppyCommandCore, VxppyTextSubCommand, VxppyTextCommand };
//# sourceMappingURL=textCommand.js.map