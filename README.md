# Dolos
Plagiarism detection for Dodona based on the Winnowing algorithm

http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf

## Work plan
- Set up typescript and VS code
- Hash function
  - Inplement Rabin fingerprinting (with fix)
  - Test to see if hashes are uniform (and implementation is correct)
  - Write performance tests
  - Upgrade the functionn to inncrementally calculate the hashes
  - Validate if the incremental hash values are identical to the initial values
  - Check the performance difference
- Winnowing algorithm
  - Implement Winnowing as described in figure 5
  - Manually validate if the result is correct (also check the positions)
  - Test with a few text files to see if it works
- Write code to handle multiple files and create an index of hashes
- Write code to query the index
- Input normalization
  - We need a tokenizer
  - Check if the Semantic project by Github is useable for this
- Test with actual code and tweak paramters
- Link back the match position to the code
- Pretty reporting
