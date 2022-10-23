const fs = require('fs/promises')

const SLACK_DATA_FOLDER_PATH = 'slack-data/'

async function initSlackDataFile(info) {
  await createSlackDataFolder()
  return await createSlackDataFile(info)
}

async function createSlackDataFolder() {
  try {
    await fs.stat(SLACK_DATA_FOLDER_PATH)
  } catch (error) {
    console.error("Slack data directory doesn't exist.")
    try {
      await fs.mkdir(SLACK_DATA_FOLDER_PATH)
      console.log('Created Slack data directory at:', SLACK_DATA_FOLDER_PATH)
    } catch (error) {
      console.error('Failed to create Slack data directory.')
      throw error
    }
  }
}

async function createSlackDataFile(path) {
  const filePath = path;

  try {
    const fileHandle = await fs.open(filePath, 'w')
    await fileHandle.close()
    console.log('Created Slack data file at:', filePath)
  } catch (error) {
    console.error('Failed to create Slack data file.')
    throw error
  }

  return appendHTMLToSlackDataFile(filePath)
}

const appendHTMLToSlackDataFile = filePath => postsHTML => {
  fs.appendFile(filePath, postsHTML.join('\n'))
    .then(() => {
      const currentTime = new Date()
      const timestamp = `${currentTime.getHours()}:${currentTime.getMinutes()} ${
        currentTime.getHours() >= 12 ? 'PM' : 'AM'
      }`
      console.log(`Appended HTML data to Slack data file. ${timestamp}`)
    })
    .catch(error => {
      console.log('Failed to append HTML data to Slack data file.')
      throw error
    })
}

exports.initSlackDataFile = initSlackDataFile
