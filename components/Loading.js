import { Flex, Box } from "rebass"
export default ({ text, color = "#5386e4", textColor = "#4A78CD" }) => (
  <Flex
    width={1}
    textAlign="center"
    sx={{ height: "100%" }}
    justifyContent="center"
    alignItems="center"
  >
    <style jsx>{`
      .lds-ripple {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
      }
      .lds-ripple div {
        position: absolute;
        border: 4px solid ${color};
        opacity: 1;
        border-radius: 50%;
        animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
      }
      .lds-ripple div:nth-child(2) {
        animation-delay: -0.5s;
      }
      @keyframes lds-ripple {
        0% {
          top: 36px;
          left: 36px;
          width: 0;
          height: 0;
          opacity: 1;
        }
        100% {
          top: 0px;
          left: 0px;
          width: 72px;
          height: 72px;
          opacity: 0;
        }
      }
    `}</style>
    <Box p={4}>
      <div className="lds-ripple">
        <div></div>
        <div></div>
      </div>
      <Box mt={3} color={textColor}>
        {text}
      </Box>
    </Box>
  </Flex>
)
