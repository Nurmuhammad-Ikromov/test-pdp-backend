const zlib = require('zlib')
const msgpack = require('msgpack-lite')

// JSON obyektni oddiy `JSON.stringify` orqali stringga aylantirish va Base64 formatga o‘tkazish
function encodeBase64(jsonObject) {
  const jsonString = JSON.stringify(jsonObject)
  return Buffer.from(jsonString).toString('base64')
}

function decodeBase64(base64String) {
  const jsonString = Buffer.from(base64String, 'base64').toString('utf-8')
  return JSON.parse(jsonString)
}

function encodeGzipBase64(jsonObject) {
  const jsonString = JSON.stringify(jsonObject)
  return new Promise((resolve, reject) => {
    zlib.gzip(jsonString, (err, buffer) => {
      if (err) reject(err)
      else resolve(buffer.toString('base64'))
    })
  })
}

function decodeGzipBase64(base64String) {
  const compressedBuffer = Buffer.from(base64String, 'base64')
  return new Promise((resolve, reject) => {
    zlib.gunzip(compressedBuffer, (err, buffer) => {
      if (err) reject(err)
      else resolve(JSON.parse(buffer.toString()))
    })
  })
}

// JSON obyektni `msgpack-lite` bilan siqish va Base64 ga o‘tkazish
function encodeMsgpackBase64(jsonObject) {
  const packedData = msgpack.encode(jsonObject)
  return packedData.toString('base64')
}

function decodeMsgpackBase64(base64String, role = 'teacher') {
  if (!base64String) {
    return null
  }
  const buffer = Buffer.from(base64String, 'base64')
  let decodedData = msgpack.decode(buffer)
  if (role === 'teacher' || role === "director") {
    return decodedData
  } else if (role === 'student') {
    let keyObj = Object.keys(decodedData)
    if (keyObj.length) {
      for (let id = 0; id < keyObj.length; id++) {
        const element = decodedData[keyObj[id]]
        delete element.correctAnswer

      }
    }
    return decodedData
  }
}

module.exports = { encodeMsgpackBase64, decodeMsgpackBase64 }
