<template>
  <a class="link-button" :href="link"><slot></slot></a>
</template>

<script>
  export default {
    props: ['link']
  }
</script>

<style lang="stylus" scoped>
  .link-button
    display inline-block
    font-size 1.2rem
    color #fff
    background-color $accentColor
    padding 0.8rem 1.6rem
    border-radius 4px
    transition background-color .1s ease
    box-sizing border-box
    border-bottom 1px solid darken($accentColor, 10%)
    &:hover
      background-color lighten($accentColor, 10%)

    @media(max-width: $MWMobileNarrow)
      .action-button
        font-size 1rem
        padding 0.6rem 1.2rem
</style>