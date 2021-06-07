import { FetchResponse } from './fetch_response'
import { getCookie } from './lib/cookie'

export class FetchRequest {
  constructor (method, url, options = {}) {
    this.method = method
    this.url = url
    this.options = options
  }

  async perform () {
    const response = new FetchResponse(await window.fetch(this.url, this.fetchOptions))

    if (response.unauthenticated && response.authenticationURL) {
      return Promise.reject(window.location.href = response.authenticationURL)
    }

    if (response.ok && response.isTurboStream) { response.renderTurboStream() }
    return response
  }

  get fetchOptions () {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.body,
      signal: this.signal,
      credentials: 'same-origin',
      redirect: 'follow'
    }
  }

  get headers () {
    return compact(
      Object.assign({
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.csrfToken,
        'Content-Type': this.contentType,
        Accept: this.accept
      },
      this.additionalHeaders)
    )
  }

  get csrfToken () {
    return getCookie(metaContent('csrf-param')) || metaContent('csrf-token')
  }

  get contentType () {
    if (this.options.contentType) {
      return this.options.contentType
    } else if (this.body == null || this.body instanceof window.FormData) {
      return undefined
    } else if (this.body instanceof window.File) {
      return this.body.type
    }

    return 'application/json'
  }

  get accept () {
    switch (this.responseKind) {
      case 'html':
        return 'text/html, application/xhtml+xml'
      case 'turbo-stream':
        return 'text/vnd.turbo-stream.html, text/html, application/xhtml+xml'
      case 'json':
        return 'application/json'
      default:
        return '*/*'
    }
  }

  get body () {
    return this.options.body
  }

  get responseKind () {
    return this.options.responseKind || 'html'
  }

  get signal () {
    return this.options.signal
  }

  get additionalHeaders () {
    return this.options.headers || {}
  }
}

function compact (object) {
  const result = {}

  for (const key in object) {
    const value = object[key]
    if (value !== undefined) {
      result[key] = value
    }
  }

  return result
}

function metaContent (name) {
  const element = document.head.querySelector(`meta[name="${name}"]`)
  return element && element.content
}
