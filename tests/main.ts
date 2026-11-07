import { parseTextCommand } from '../src/parseTextCommand';
import { textCommand } from '../src/textCommand';

const command = textCommand('help').option(
    'command',
    (opt) => {
        console.log(opt);
        return opt;
    },
    // .description('Command you want to get help about'),
);
// .description('Get help with commands of the bot')
// .callback(async ({ message, options, ctx }) => {});

console.log(command.Options);
parseTextCommand(command, 'hello there');
