<%@ page import="java.io.*, java.net.*" pageEncoding="UTF-8"%>
<%
	StringBuffer sbf = new StringBuffer();
    String address = "http://147.27.14.7:8080/sokratis/process.jsp?sentence=";
    //response.setContentType("text/html; charset=UTF-8");
    //response.setCharacterEncoding("UTF-8");
    //Access the page
    try {    
   		//Encode the parameters. Spaces will be replaced by '+'
    	String encodedParameter = URLEncoder.encode(request.getParameter("sentence"),"UTF-8");
        
   		//Create the url - GET request
   		URL url = new URL(address+encodedParameter);
   		//System.err.println(encodedParameter);

        BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream(),"UTF8"));
        String inputLine;
        //System.err.println("Response: ");
        while ( (inputLine = in.readLine()) != null) 
        {
        	sbf.append(inputLine);
        	//System.err.println(inputLine);
        }
        in.close();
    } 
    catch (MalformedURLException e) {
    	out.println(e.getMessage());
    } 
    catch (IOException e) {
    	out.println(e.getMessage());
    }
%><%= sbf.toString() %>