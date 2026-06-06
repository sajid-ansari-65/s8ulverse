import config from '@payload-config'
import { getPayload } from 'payload'

// Local API client for Server Components — direct in-process queries, no HTTP hop.
export const getPayloadClient = async () => getPayload({ config })
