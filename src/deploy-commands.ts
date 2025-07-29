import { REST } from '@discordjs/rest'
import { RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder, Snowflake } from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { clientId, token } from '../config/config.json'
import { PrettyLog } from './utils/pretty-log'

let rest: REST | undefined

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    commands.push((command.data as SlashCommandBuilder).toJSON())
}

function appDeployCommands() {
    return new Promise((resolve, reject) => {
        getRest().put(Routes.applicationCommands(clientId), { body: commands })
            .then(() => {
                PrettyLog.success('Successfully registered application commands.', false)
                resolve(true)
            })
            .catch(reject)
        })

}
function appDeleteCommands() {
    return new Promise((resolve, reject) => {
        getRest().put(Routes.applicationCommands(clientId), { body: [] })
            .then(() => {
                PrettyLog.success('Successfully deleted application commands.', false)
                resolve(true)
            })
            .catch(reject)
    })
}

function guildDeployCommands(guildId: Snowflake) {
    return new Promise((resolve, reject) => {
        getRest().put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
            .then(() => {
                PrettyLog.success('Successfully registered all guild commands.', false)
                resolve(true)
            })
            .catch(reject)
    })
}

function guildDeleteCommands(guildId: Snowflake) {
    return new Promise((resolve, reject) => {
        getRest().put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
            .then(() => {
                PrettyLog.success('Successfully deleted all guild commands.', false)
                resolve(true)
            })
            .catch(reject)
    })
}

export {
    appDeleteCommands, appDeployCommands, guildDeleteCommands, guildDeployCommands
}

if (require.main === module) {

    const flag = process.argv[2]
    const guildId = process.argv[3]

    switch (flag) {
        case '/a':
            appDeployCommands()
            break

        case '/ad':
            appDeleteCommands()
            break

        case '/g':
            if (!guildId) {
                PrettyLog.error('Please specify a guild id')
                break
            }
            guildDeployCommands(guildId)
            break 
            
        case '/gd':
            if (!guildId) {
                PrettyLog.error('Please specify a guild id')
                break
            }
            guildDeleteCommands(guildId)
            break 

        default:
            PrettyLog.error('Please specify one of these flags: \n\n    /a  : Deploy App Commands\n    /ad : Delete App Commands\n    /g  : Deploy Guild Commands\n    /gd : Delete Guild Commands\n')
    }
}



function getRest() {
    if (!clientId || !token) {
        PrettyLog.error('Missing clientId or token in config.json')
        process.exit(1)
    }

    if (!rest) {
        rest = new REST({ version: '10' }).setToken(token)
    }
    return rest
}
