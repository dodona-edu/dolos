# Dolos
Plagiarism detection for Dodona based on the Winnowing algorithm

http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf

## How to get started
- Clone the repository
- Run `yarn install` to install all dependencies
- If you want to generate plain JS files, run `tsc` and the `dist` folder should be created
- Running `yarn run start` will compile everything and run the `app.js` file
- Running `yarn run test-performance` will run a performance test on 1M random bytes and print the execution time

## Work plan
- Set up typescript and VS code
- [x] Hash function
  - [x] Implement [hashing](https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm#Hash_function_used) from Rabin-Karp
  - [x] Test to see if hashes are uniform (and implementation is correct)
  - [x] Write performance tests
  - [x] Upgrade the function to incrementally calculate the hashes
  - [x] Validate if the incremental hash values are identical to the initial values
  - [x] Check the performance difference
- Winnowing algorithm
  - [x] Implement Winnowing as described in figure 5
  - Manually validate if the result is correct (also check the positions)
  - Test with a few text files to see if it works
- Write code to handle multiple files and create an index of hashes
- Write code to query the index
- Input normalization
  - We need a tokenizer
  - Check if the [Semantic](https://github.com/github/semantic) project by Github is useable for this
- Test with actual code and tweak paramters
- Link back the match position to the code
- Pretty reporting
