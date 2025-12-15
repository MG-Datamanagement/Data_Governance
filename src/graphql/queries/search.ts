export const SEARCH_DATASETS = `
query Search($input: SearchInput!) {
  search(input: $input) {
    total
    searchResults {
      entity {
        ... on Dataset {
          name
          urn
          properties {
            description
            lastModified { time }
            created
            createdActor
          }
          platform { name }
          tags {
            tags {
              tag { 
                properties {
                  name
                  colorHex
                }
              }
            }
          }
          domain {
            domain {
              urn
              properties { name }
            }
          }
        }
      }
    }
  }
}
`;
