import type { Message, OmitPartialGroupDMChannel } from 'discord.js';
import {
    ConsumeMode,
    type VxppyTextCommandContext,
    type VxppyTextCommandExtensions,
    type VxppyTextCommandMetadata,
} from './types.js';

type MessageWithSendableChannel = OmitPartialGroupDMChannel<Message<boolean>>;

type Simplfy<T> = { [K in keyof T]: T[K] } & {};
type MakeOption<
    TName extends string,
    TRequired extends boolean,
    TValue,
    TDefault extends boolean,
> = TRequired extends true
    ? { [K in TName]: TValue }
    : TDefault extends true
      ? { [K in TName]: TValue }
      : { [K in TName]?: TValue };

interface VxppySubCommandData {
    name: string;
    subCommand: VxppyTextSubCommand<any>;
}

interface VxppyDefaultCommandOption {
    $raw: string;
}

interface VxppyOptionData {
    name: string;
    required: boolean;
    consumes?: ConsumeMode;
    description?: string;
    enum?: string[];
    default?: string;
}

class VxppyOption<
    TValue = string,
    TRequired extends boolean = false,
    TConsumes extends ConsumeMode | undefined = undefined,
    TDefault extends boolean = false,
> {
    declare private readonly __required: TRequired;
    declare private readonly __consumed: TConsumes;

    private _required: boolean = false;
    private _consumes: ConsumeMode | undefined = undefined;
    private _default: string | undefined = undefined;

    private _enum?: string[];
    private _description?: string;

    constructor(private readonly name: string) {}

    enum<const TEnum extends string[]>(
        this: VxppyOption<TValue, TRequired, undefined, TDefault>,
        ...values: TEnum
    ) {
        this._enum = values;
        return this as VxppyOption<
            TEnum[number],
            TRequired,
            undefined,
            TDefault
        >;
    }

    required<const TState extends boolean = true>(
        state: TState = true as TState,
    ) {
        this._required = state;
        return this as unknown as VxppyOption<
            TValue,
            TState,
            TConsumes,
            TDefault
        >;
    }

    consumes<const TState extends ConsumeMode = ConsumeMode.Raw>(
        state: TState = ConsumeMode.Raw as TState,
    ) {
        this._consumes = state;
        return this as unknown as VxppyOption<
            TState extends ConsumeMode.Tokenized ? string[] : TValue,
            TRequired,
            TState,
            TDefault
        >;
    }

    description(description: string) {
        this._description = description;
        return this;
    }

    default(value: TValue) {
        this._default = value as string;

        return this as unknown as VxppyOption<
            TValue,
            TRequired,
            TConsumes,
            true
        >;
    }

    get Data(): VxppyOptionData {
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

declare enum CommandType {
    Empty,
    Arguments,
    SubCommand,
    Consumed,
}

export type { CommandType };

type Children<TState> = TState extends CommandType.SubCommand
    ? VxppySubCommandData[]
    : VxppyOptionData[];

abstract class VxppyCommandCore {
    protected _children: Children<any> = [];
    private _hasSubCommands = false;
    private _hasOptions = false;
    private _description?: string;

    constructor(protected readonly name: string) {}

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

    description(description: string) {
        this._description = description;
        return this;
    }

    option(name: string, transform?: (opt: VxppyOption) => VxppyOption): any {
        if (this._hasSubCommands) {
            throw new Error(
                "Subcommands and options can't exist on the same command",
            );
        }
        this._hasOptions = true;

        let option = new VxppyOption(name);
        if (transform) {
            option = transform(option);
        }

        // @ts-ignore
        this._children.push(option.Data);

        return this;
    }

    subCommand(
        name: string,
        transform?: (opt: VxppyTextSubCommand) => VxppyTextSubCommand,
    ): any {
        if (this._hasOptions) {
            throw new Error(
                "Subcommands and options can't exist on the same command",
            );
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

class VxppyTextSubCommand<
    TOptions extends object = {},
    TState extends CommandType = CommandType,
    TCanRequire extends boolean = boolean,
> extends VxppyCommandCore {
    declare private readonly __state: TState;

    declare hasSubCommands: () => this is VxppyTextSubCommand<
        TOptions,
        CommandType.SubCommand,
        TCanRequire
    >;

    declare hasOptions: () => this is VxppyTextSubCommand<
        TOptions,
        CommandType.Arguments,
        TCanRequire
    >;

    get Options() {
        return this._children as unknown as Children<TState>;
    }

    declare option: <
        const TName extends string,
        const TValue = string,
        const TRequired extends boolean = false,
        const TConsumed extends ConsumeMode | undefined = undefined,
        const TDefault extends boolean = false,
    >(
        this: VxppyTextSubCommand<
            TOptions,
            CommandType.Empty | CommandType.Arguments,
            TCanRequire
        >,
        name: TName,
        transform?: (
            opt: VxppyOption,
        ) => TCanRequire extends true
            ? VxppyOption<TValue, TRequired, TConsumed, TDefault>
            : VxppyOption<TValue, false, TConsumed, TDefault>,
    ) => VxppyTextSubCommand<
        Simplfy<
            TOptions &
                MakeOption<
                    TName,
                    TCanRequire extends true ? TRequired : false,
                    TValue,
                    TDefault
                >
        >,
        TConsumed extends true ? CommandType.Consumed : CommandType.Arguments,
        TCanRequire extends true ? TRequired : false
    >;

    declare subCommand: <
        const TName extends string,
        const TShape extends {} = {},
    >(
        this: VxppyTextSubCommand<
            TOptions,
            CommandType.Empty | CommandType.SubCommand,
            TCanRequire
        >,
        name: TName,
        transform?: (
            opt: VxppyTextSubCommand<{}, CommandType.Empty, true>,
        ) => VxppyTextSubCommand<TShape, CommandType, boolean>,
    ) => VxppyTextSubCommand<
        Simplfy<
            TOptions &
                MakeOption<
                    TName,
                    false,
                    Simplfy<TShape & VxppyDefaultCommandOption>,
                    false
                >
        >,
        CommandType.SubCommand,
        TCanRequire
    >;
}

interface ExecuteParameters<TOptions> {
    message: MessageWithSendableChannel;
    options: Simplfy<TOptions & VxppyTextCommandExtensions>;
    ctx: VxppyTextCommandContext;
}

type TextCommandCallback<TOptions> = (
    this: VxppyTextCommand<any, any, any, any>,
    options: ExecuteParameters<TOptions>,
) => any;

type TextCommandCallbackWithoutThis<TOptions> = (
    options: ExecuteParameters<TOptions>,
) => any;

class VxppyTextCommand<
    TMetadata extends VxppyTextCommandMetadata = VxppyTextCommandMetadata,
    TOptions extends object = {},
    TState extends CommandType = CommandType,
    TCanRequire extends boolean = boolean,
> extends VxppyCommandCore {
    declare private readonly __state: TState;

    declare hasSubCommands: () => this is VxppyTextCommand<
        TMetadata,
        TOptions,
        CommandType.SubCommand,
        TCanRequire
    >;

    declare hasOptions: () => this is VxppyTextCommand<
        TMetadata,
        TOptions,
        CommandType.Arguments,
        TCanRequire
    >;

    declare option: <
        const TName extends string,
        const TValue = string,
        const TRequired extends boolean = false,
        const TConsumed extends ConsumeMode | undefined = undefined,
        const TDefault extends boolean = false,
    >(
        this: VxppyTextCommand<
            TMetadata,
            TOptions,
            CommandType.Empty | CommandType.Arguments,
            TCanRequire
        >,
        name: TName,
        transform?: (
            opt: VxppyOption,
        ) => TCanRequire extends true
            ? VxppyOption<TValue, TRequired, TConsumed, TDefault>
            : VxppyOption<TValue, false, TConsumed, TDefault>,
    ) => VxppyTextCommand<
        TMetadata,
        Simplfy<
            TOptions &
                MakeOption<
                    TName,
                    TCanRequire extends true ? TRequired : false,
                    TValue,
                    TDefault
                >
        >,
        TConsumed extends true ? CommandType.Consumed : CommandType.Arguments,
        TCanRequire extends true ? TRequired : false
    >;

    declare subCommand: <const TName extends string, const TShape extends {}>(
        this: VxppyTextCommand<
            TMetadata,
            TOptions,
            CommandType.Empty | CommandType.SubCommand,
            TCanRequire
        >,
        name: TName,
        transform?: (
            opt: VxppyTextSubCommand<{}, CommandType.Empty, true>,
        ) => VxppyTextSubCommand<TShape, CommandType, boolean>,
    ) => VxppyTextCommand<
        TMetadata,
        Simplfy<
            TOptions &
                MakeOption<
                    TName,
                    false,
                    Simplfy<TShape & VxppyDefaultCommandOption>,
                    false
                >
        >,
        CommandType.SubCommand,
        TCanRequire
    >;

    get Options() {
        return this._children as unknown as Children<TState>;
    }

    private _props: Partial<TMetadata> = {};
    private _alias: string[] | undefined;
    private _fn?: TextCommandCallback<TOptions>;

    get Aliases() {
        return this._alias;
    }

    alias(...aliases: string[]) {
        this._alias = aliases;
        return this;
    }

    props(props: Partial<TMetadata>) {
        this._props = { ...this._props, ...props };
        return this;
    }

    getProp<TKey extends keyof TMetadata>(prop: TKey) {
        return this._props[prop];
    }

    matchName(name: string) {
        return this.name == name || this._alias?.includes(name);
    }

    callback(callback: TextCommandCallback<TOptions>): this;
    callback(callback: TextCommandCallbackWithoutThis<TOptions>): this;

    callback(
        callback:
            | TextCommandCallbackWithoutThis<TOptions>
            | TextCommandCallback<TOptions>,
    ) {
        this._fn = callback.bind(this);
        return this;
    }

    async execute(
        message: MessageWithSendableChannel,
        options: Simplfy<
            TOptions & VxppyDefaultCommandOption & VxppyTextCommandExtensions
        >,
        ctx: VxppyTextCommandContext,
    ) {
        await this._fn?.({ message, options, ctx });
    }
}

/**
 * Create a VxppyTextCommand
 *
 * @param name Name of the command
 */
export function textCommand<
    TMetaData extends VxppyTextCommandMetadata = VxppyTextCommandMetadata,
>(name: string) {
    return new VxppyTextCommand<TMetaData, {}, CommandType.Empty, true>(name);
}

export { VxppyCommandCore, VxppyTextSubCommand, VxppyTextCommand };
