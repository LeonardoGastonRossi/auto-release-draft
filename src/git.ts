import * as core from '@actions/core'
import {exec} from '@actions/exec'
import {ExecOptions} from '@actions/exec/lib/interfaces'

export async function getChangesIntroducedByTag(tag: string): Promise<string> {
  const previousVersionTag = await getPreviousVersionTag(tag)

  return previousVersionTag
    ? getCommitMessagesBetween(previousVersionTag, tag)
    : getCommitMessagesFrom(tag)
}

export async function getPreviousVersionTag(
  tag: string
): Promise<string | null> {
  let previousTag = ''

  const options: ExecOptions = {
    listeners: {
      stderr: (data: Buffer) => {
        previousTag += data.toString()
      }
    },
    silent: true,
    ignoreReturnCode: true
  }

  const exitCode = await exec(
    'git',
    [
      'describe',
      '--match',
      'v[0-9]*',
      '--abbrev=0',
      '--first-parent',
      `${tag}^`
    ],
    options
  )
  core.debug(`The previous version tag is ${previousTag}`)

  return exitCode === 0 ? previousTag.trim() : null
}

export async function getCommitMessagesBetween(
  firstTag: string,
  secondTag: string
): Promise<string> {
  let commitMessages = ''

  const options: ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        commitMessages += data.toString()
      }
    },
    silent: true
  }

  await exec(
    'git',
    [
      'log', // Prints the commit history
      '--format=%s', // Prints only the first line of the commit message (summary)
      `${firstTag}..${secondTag}` // Includes the commits reachable from 'secondTag' but not 'firstTag'
    ],
    options
  )

  core.debug(
    `The commit messages between ${firstTag} and ${secondTag} are:\n${commitMessages}`
  )

  return commitMessages.trim()
}

export async function getCommitMessagesFrom(tag: string): Promise<string> {
  let commitMessages = ''

  const options: ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        commitMessages += data.toString()
      }
    },
    silent: true
  }

  await exec(
    'git',
    [
      'log', // Prints the commit history
      '--format=%s', // Prints only the first line of the commit message (summary)
      tag // Includes the commits reachable from the specified tag
    ],
    options
  )

  core.debug(`The commit messages from ${tag} are:\n${commitMessages}`)

  return commitMessages.trim()
}
