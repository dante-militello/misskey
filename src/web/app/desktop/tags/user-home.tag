<mk-user-home>
	<div class="side">
		<mk-user-profile user="{ user }"></mk-user-profile>
		<mk-user-photos user="{ user }"></mk-user-photos>
	</div>
	<main>
		<mk-user-timeline ref="tl" user="{ user }"></mk-user-timeline>
	</main>
	<style type="stylus">
		:scope
			display flex
			justify-content center

			> *
				> *
					display block
					//border solid 1px #eaeaea
					border solid 1px rgba(0, 0, 0, 0.075)
					border-radius 6px
					overflow hidden

					&:not(:last-child)
						margin-bottom 16px

			> main
				flex 1 1 560px
				max-width 560px
				margin 0
				padding 16px 0 16px 16px

			> .side
				flex 1 1 270px
				max-width 270px
				margin 0
				padding 16px 0 16px 0

	</style>
	<script>
		@user = @opts.user

		@on \mount ~>
			@refs.tl.on \loaded ~>
				@trigger \loaded
	</script>
</mk-user-home>
