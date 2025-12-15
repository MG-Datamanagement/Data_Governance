export interface DomainsDataResponse {
  data: Data
  extensions: Extensions
}

export interface Data {
  listDomains: ListDomains
}

export interface ListDomains {
  total: number
  domains: Domain[]
}

export interface Domain {
  urn: string
  id: string
  ownership: any
  properties: Properties
}

export interface Properties {
  name: string
  description: string
  createdOn: CreatedOn
}

export interface CreatedOn {
  time: number
}

export interface Extensions {}
