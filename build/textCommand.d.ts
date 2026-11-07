import type { Message, OmitPartialGroupDMChannel } from 'discord.js';
import { ConsumeMode, type VxppyTextCommandContext, type VxppyTextCommandExtensions, type VxppyTextCommandMetadata } from './types.js';
type MessageWithSendableChannel = OmitPartialGroupDMChannel<Message<boolean>>;
type Simplfy<T> = {
    [K in keyof T]: T[K];
} & {};
type MakeOption<TName extends string, TRequired extends boolean, TValue, TDefault extends boolean> = TRequired extends true ? {
    [K in TName]: TValue;
} : TDefault extends true ? {
    [K in TName]: TValue;
} : {
    [K in TName]?: TValue;
};
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
declare class VxppyOption<TValue = string, TRequired extends boolean = false, TConsumes extends ConsumeMode | undefined = undefined, TDefault extends boolean = false> {
    private readonly name;
    private readonly __required;
    private readonly __consumed;
    private _required;
    private _consumes;
    private _default;
    private _enum?;
    private _description?;
    constructor(name: string);
    enum<const TEnum extends string[]>(this: VxppyOption<TValue, TRequired, undefined, TDefault>, ...values: TEnum): VxppyOption<TEnum[number], TRequired, undefined, TDefault>;
    required<const TState extends boolean = true>(state?: TState): VxppyOption<TValue, TState, TConsumes, TDefault>;
    consumes<const TState extends ConsumeMode = ConsumeMode.Raw>(state?: TState): VxppyOption<TState extends ConsumeMode.Tokenized ? string[] : TValue, TRequired, TState, TDefault>;
    description(description: string): this;
    default(value: TValue): VxppyOption<TValue, TRequired, TConsumes, true>;
    get Data(): VxppyOptionData;
}
declare enum CommandType {
    Empty,
    Arguments,
    SubCommand,
    Consumed
}
export type { CommandType };
type Children<TState> = TState extends CommandType.SubCommand ? VxppySubCommandData[] : VxppyOptionData[];
declare abstract class VxppyCommandCore {
    protected readonly name: string;
    protected _children: Children<any>;
    private _hasSubCommands;
    private _hasOptions;
    private _description?;
    constructor(name: string);
    hasSubCommands(): boolean;
    hasOptions(): boolean;
    get Description(): string | undefined;
    get Name(): string;
    description(description: string): this;
    option(name: string, transform?: (opt: VxppyOption) => VxppyOption): any;
    subCommand(name: string, transform?: (opt: VxppyTextSubCommand) => VxppyTextSubCommand): any;
}
declare class VxppyTextSubCommand<TOptions extends object = {}, TState extends CommandType = CommandType, TCanRequire extends boolean = boolean> extends VxppyCommandCore {
    private readonly __state;
    hasSubCommands: () => this is VxppyTextSubCommand<TOptions, CommandType.SubCommand, TCanRequire>;
    hasOptions: () => this is VxppyTextSubCommand<TOptions, CommandType.Arguments, TCanRequire>;
    get Options(): Children<TState>;
    option: <const TName extends string, const TValue = string, const TRequired extends boolean = false, const TConsumed extends ConsumeMode | undefined = undefined, const TDefault extends boolean = false>(this: VxppyTextSubCommand<TOptions, CommandType.Empty | CommandType.Arguments, TCanRequire>, name: TName, transform?: (opt: VxppyOption) => TCanRequire extends true ? VxppyOption<TValue, TRequired, TConsumed, TDefault> : VxppyOption<TValue, false, TConsumed, TDefault>) => VxppyTextSubCommand<Simplfy<TOptions & MakeOption<TName, TCanRequire extends true ? TRequired : false, TValue, TDefault>>, TConsumed extends true ? CommandType.Consumed : CommandType.Arguments, TCanRequire extends true ? TRequired : false>;
    subCommand: <const TName extends string, const TShape extends {} = {}>(this: VxppyTextSubCommand<TOptions, CommandType.Empty | CommandType.SubCommand, TCanRequire>, name: TName, transform?: (opt: VxppyTextSubCommand<{}, CommandType.Empty, true>) => VxppyTextSubCommand<TShape, CommandType, boolean>) => VxppyTextSubCommand<Simplfy<TOptions & MakeOption<TName, false, Simplfy<TShape & VxppyDefaultCommandOption>, false>>, CommandType.SubCommand, TCanRequire>;
}
interface ExecuteParameters<TOptions> {
    message: MessageWithSendableChannel;
    options: Simplfy<TOptions & VxppyTextCommandExtensions>;
    ctx: VxppyTextCommandContext;
}
type TextCommandCallback<TOptions> = (this: VxppyTextCommand<any, any, any, any>, options: ExecuteParameters<TOptions>) => any;
type TextCommandCallbackWithoutThis<TOptions> = (options: ExecuteParameters<TOptions>) => any;
declare class VxppyTextCommand<TMetadata extends VxppyTextCommandMetadata = VxppyTextCommandMetadata, TOptions extends object = {}, TState extends CommandType = CommandType, TCanRequire extends boolean = boolean> extends VxppyCommandCore {
    private readonly __state;
    hasSubCommands: () => this is VxppyTextCommand<TMetadata, TOptions, CommandType.SubCommand, TCanRequire>;
    hasOptions: () => this is VxppyTextCommand<TMetadata, TOptions, CommandType.Arguments, TCanRequire>;
    option: <const TName extends string, const TValue = string, const TRequired extends boolean = false, const TConsumed extends ConsumeMode | undefined = undefined, const TDefault extends boolean = false>(this: VxppyTextCommand<TMetadata, TOptions, CommandType.Empty | CommandType.Arguments, TCanRequire>, name: TName, transform?: (opt: VxppyOption) => TCanRequire extends true ? VxppyOption<TValue, TRequired, TConsumed, TDefault> : VxppyOption<TValue, false, TConsumed, TDefault>) => VxppyTextCommand<TMetadata, Simplfy<TOptions & MakeOption<TName, TCanRequire extends true ? TRequired : false, TValue, TDefault>>, TConsumed extends true ? CommandType.Consumed : CommandType.Arguments, TCanRequire extends true ? TRequired : false>;
    subCommand: <const TName extends string, const TShape extends {}>(this: VxppyTextCommand<TMetadata, TOptions, CommandType.Empty | CommandType.SubCommand, TCanRequire>, name: TName, transform?: (opt: VxppyTextSubCommand<{}, CommandType.Empty, true>) => VxppyTextSubCommand<TShape, CommandType, boolean>) => VxppyTextCommand<TMetadata, Simplfy<TOptions & MakeOption<TName, false, Simplfy<TShape & VxppyDefaultCommandOption>, false>>, CommandType.SubCommand, TCanRequire>;
    get Options(): Children<TState>;
    private _props;
    private _alias;
    private _fn?;
    get Aliases(): string[] | undefined;
    alias(...aliases: string[]): this;
    props(props: Partial<TMetadata>): this;
    getProp<TKey extends keyof TMetadata>(prop: TKey): Partial<TMetadata>[TKey];
    matchName(name: string): boolean | undefined;
    callback(callback: TextCommandCallback<TOptions>): this;
    callback(callback: TextCommandCallbackWithoutThis<TOptions>): this;
    execute(message: MessageWithSendableChannel, options: Simplfy<TOptions & VxppyDefaultCommandOption & VxppyTextCommandExtensions>, ctx: VxppyTextCommandContext): Promise<void>;
}
/**
 * Create a VxppyTextCommand
 *
 * @param name Name of the command
 */
export declare function textCommand<TMetaData extends VxppyTextCommandMetadata = VxppyTextCommandMetadata>(name: string): VxppyTextCommand<TMetaData, {}, CommandType.Empty, true>;
export { VxppyCommandCore, VxppyTextSubCommand, VxppyTextCommand };
//# sourceMappingURL=textCommand.d.ts.map