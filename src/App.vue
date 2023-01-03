<template>
  <HelloWorld v-if="route===1"/>
  <rockerControl v-if="route===2"/>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import rockerControl from "@/components/rockerControl"; './components/rockerControl'

export default {
  name: 'App',
  components: {
    HelloWorld,
    rockerControl,
  },
  data(){
    return {
      route: 1
    }
  }
}
</script>

<style>
  body{
    margin: 0;
  }

</style>
