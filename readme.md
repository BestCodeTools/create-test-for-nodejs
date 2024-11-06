# @bestcodetools/create-test-file-for-nodejs

## Description

A CLI for generating dummy test files for .js|.ts|.jsx|.tsx

## Installation

`npm i @bestcodetools/create-test-file-for-nodejs`

## Usage

`create-test-for [options] <path1> <path2> ...`

### Options:
<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>--test-path=&lt;path&gt;</td>
      <td>Path to store test files</td>
    </tr>
    <tr>
      <td>--help</td>
      <td>Show help</td>
    </tr>
  </tbody>
</table>


```node
  NOTE: Use "--test-path=@" to store test files in the same directory as the source files
```

### Examples:
  create-test-for src --test-path=test/unit
  create-test-for src --test-path=@

### Aliases:
  * `ctf [options] <path1> <path2> ...`
  * `create-test-file-for [options] <path1> <path2> ...`


## License

This project is licensed under the [MIT License](link-to-license).
