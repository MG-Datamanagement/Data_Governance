export const LIST_DATASETS = `
query ListDatasets($start: Int!, $count: Int!) {
  listDatasets(start: $start, count: $count) {
    total
    datasets {
      name
      urn
      properties {
        description
      }
      platform { name }
    }
  }
}
`;
