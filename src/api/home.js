import request from '@/utils/request'

/**
 * @desc 生成词语接口
 * @param {Object} data - { type: "词语生成", difficulty: "化神" }
 * @returns {Promise}
 */
export function getWordList(data) {
  return request.post('/workflows/run', data)
}

/**
 * @desc 语义匹配接口
 * @param {Object} data - { type: "语义匹配", word: "xxx" }
 * @returns {Promise}
 */
export function getSemanticMatch(data) {
  return request.post('/workflows/run', data)
}

/**
 * @desc 投票/判断接口
 * @param {Object} data - { type: "投票", content: "xxx" }
 * @returns {Promise}
 */
export function getVoteResult(data) {
  return request.post('/workflows/run', data)
}