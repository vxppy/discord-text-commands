import {} from './textCommand.js';
import { ConsumeMode } from './types.js';
const partition = function (str, matcher) {
    if (typeof matcher == 'string') {
        const index = str.indexOf(matcher);
        if (index == -1) {
            return [str, '', ''];
        }
        else {
            return [
                str.slice(0, index),
                matcher,
                str.slice(index + matcher.length),
            ];
        }
    }
    const match = str.match(matcher);
    if (!match)
        return [str, '', ''];
    return [
        str.slice(0, match.index),
        match[0],
        str.slice(match.index + match[0].length),
    ];
};
const singleOption = (argString) => {
    let quote;
    let quoted = false;
    if (argString[0] === '"' || argString[0] === "'" || argString[0] === '`') {
        quoted = true;
        quote = argString[0];
    }
    for (let i = quoted ? 1 : 0; i < argString.length; i++) {
        if (!quote) {
            if (argString[i] === ' ' && argString[i - 1] !== '\\') {
                return [
                    argString.slice(0, i).replace(/\\([ "'`\\])/g, '$1'),
                    argString.slice(i + 1),
                ];
            }
            continue;
        }
        if (argString[i] === quote && argString[i - 1] !== '\\') {
            const next = i + 1;
            if (next >= argString.length || argString[next] === ' ') {
                return [
                    argString.slice(1, i).replace(/\\([ "'`\\])/g, '$1'),
                    next < argString.length ? argString.slice(next + 1) : '',
                ];
            }
        }
    }
    return [
        (quoted ? argString.slice(1) : argString).replace(/\\([ "'`\\])/g, '$1'),
        '',
    ];
};
function tokenizeAll(input) {
    const tokens = [];
    while (input.length) {
        const [token, rest] = singleOption(input);
        tokens.push(token);
        input = rest;
    }
    return tokens;
}
const parseNode = (command, argString, path = []) => {
    const result = { $raw: argString };
    argString = argString.trim();
    if (!argString.length) {
        if (!command.Options.length) {
            return result;
        }
        if (command.hasSubCommands()) {
            throw new Error(`Missing required subcommand for command \`${path.join(' ')}${path.length ? ' ' : ''}${command.Name}\`\nPossible subcommands are ${command.Options.map((i) => `\`${i.name}\``).join(' | ')}`);
        }
        if (!command.hasOptions())
            return result;
        for (const option of command.Options) {
            if (option.required) {
                throw new Error(`Missing required argument for the option \`${option.name}\` in command \`${path.join(' ')}${path.length ? ' ' : ''}${command.Name}\``);
            }
        }
        return result;
    }
    path.push(command.Name);
    try {
        if (command.hasSubCommands()) {
            const [resolveable, _, rest] = partition(argString, /\s+/).map((x, i) => (i == 0 ? x.toLowerCase() : x));
            if (!resolveable)
                return result; // impossible but ;b
            const subcommand = command.Options.find((i) => i.name == resolveable);
            if (!subcommand) {
                throw new Error(`Unknown subcommand \`${resolveable}\` for command \`${path.join(' ')}\``);
            }
            result[subcommand.name] = parseNode(subcommand.subCommand, rest.trim(), path);
            return result;
        }
        if (!command.hasOptions())
            return result;
        for (const option of command.Options) {
            if (!argString.length) {
                if (option.required) {
                    throw new Error(`Missing required option \`${option.name}\` for command \`${path.join(' ')}\``);
                }
                result[option.name] =
                    option.default !== undefined ? option.default : undefined;
                continue;
            }
            if (option.consumes) {
                switch (option.consumes) {
                    case ConsumeMode.Raw: {
                        result[option.name] = argString;
                        break;
                    }
                    case ConsumeMode.Tokenized: {
                        result[option.name] = tokenizeAll(argString);
                    }
                }
                break;
            }
            const [opt, rest] = singleOption(argString);
            if (option.enum && !option.enum.includes(opt.toLowerCase())) {
                throw new Error(`\`${option.name}\` expects argument to be one of \`${option.enum.join('` | `')}\` for command \`${path.join(' ')}\``);
            }
            result[option.name] = opt;
            argString = rest.trim();
        }
        return result;
    }
    finally {
        path.pop();
    }
};
export function parseTextCommand(command, argString) {
    return parseNode(command, argString);
}
//# sourceMappingURL=parseTextCommand.js.map