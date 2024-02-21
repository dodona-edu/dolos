caesar <- function(x, key)
{
  # if key is negative, wrap to be positive
  if (key < 0) {
    key <- 26 + key 
  }
  
  old <- paste(letters, LETTERS, collapse="", sep="")
  new <- paste(substr(old, key * 2 + 1, 52), substr(old, 1, key * 2), sep="")
  chartr(old, new, x)
}

# simple examples from description
print(caesar("hi",2))
print(caesar("hi",20))

# more advanced example
key <- 3
plaintext <- "The five boxing wizards jump quickly."
cyphertext <- caesar(plaintext, key)
decrypted <- caesar(cyphertext, -key)

print(paste("    Plain Text: ", plaintext, sep=""))
print(paste("   Cypher Text: ", cyphertext, sep=""))
print(paste("Decrypted Text: ", decrypted, sep=""))
