import React from 'react'

// Import typefaces
import 'typeface-montserrat'
import 'typeface-merriweather'

import profilePic from './profile.jpg'
import { rhythm } from '../utils/typography'

class Bio extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          marginBottom: rhythm(2.5),
        }}
      >
        <img
          src={profilePic}
          alt={`FAMASoon(Ryota Sakai)`}
          style={{
            marginRight: rhythm(1 / 2),
            marginBottom: 0,
            width: rhythm(2),
            height: rhythm(2),
          }}
        />
        <p>
          Written by <strong>FAMASoon(Ryota Sakai)</strong> who lives and works in Tokyo building security software.{' '}
          <a href="https://twitter.com/FAMASoon">
            Twitter
          </a>/
          <a href="https://github.com/famasoon">
            GitHub
          </a>
        </p>
      </div>
    )
  }
}

export default Bio
