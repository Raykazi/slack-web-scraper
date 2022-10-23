const { ScrollFeed } = require('./scrollFeed')
const { initSlackDataFile } = require('./initSlackDataFile')
const { extractPostsHTML } = require('./extractPostsHTML')
const {FileUtils} = require("../../../../parseData/utils/FileUtils");
const {pipe} = require("../../pipe");
const {parsePostsToJson} = require("../../parsePostsToJson");
const {filterHTMLByValidElement} = require("../../filterHTMLByValidElement");
const {encodeNewlinePreElements} = require("../../encodeNewlinePreElements");
const {groupByDate} = require("../../groupByDate");
const SLACK_DATA_FOLDER_PATH = 'slack-data/'

function createTimestamp() {
  const date = new Date()
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  return [year, month, day].join('-')
}

async function collectPosts(page, info) {
  const channelFeedSelector = '[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"]'
  const postsSelector = `${channelFeedSelector} > div`

  const scrollFeed = await ScrollFeed(page, channelFeedSelector)
  await scrollFeed.toTop()

  let { type, name } = info;
  let path = SLACK_DATA_FOLDER_PATH + type + '-' + name.replace(' ', '_') + '-' + createTimestamp() + '.html'
  const appendHTMLToSlackDataFile = await initSlackDataFile(path)
  await scrollFeed.toBottom(async () => {
    const postsHTML = await extractPostsHTML(page, postsSelector)
    if(postsHTML.length > 0)
      appendHTMLToSlackDataFile(postsHTML)
  })

  const {
    readFile,
    leaveBreadcrumb,
    message,
    saveNewFileWithExtension,
    saveNewJSONFileWithExtension,
  } = FileUtils(path)

  const parseHTML = pipe(
      readFile,
      encodeNewlinePreElements,
      leaveBreadcrumb(
          message('Encoded newlines in pre elements.'),
          saveNewFileWithExtension('.0-newline-encoded-pre-elements.html')
      ),
      filterHTMLByValidElement,
      leaveBreadcrumb(
          message('Filtered unexpected elements.'),
          saveNewFileWithExtension('.1-filter-unexpected-elements.html')
      ),
      groupByDate,
      // prettier-ignore
      leaveBreadcrumb(
          message('Grouped elements by date.'),
          saveNewJSONFileWithExtension('.2-group-by-date.json')
      ),
      parsePostsToJson,
      // prettier-ignore
      leaveBreadcrumb(
          saveNewJSONFileWithExtension('.json'),
          saveNewJSONFileWithExtension('.parsed-posts.json')
      )
  )
  parseHTML();
}

exports.collectPosts = collectPosts
